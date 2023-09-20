"use strict";

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dayjs = require("dayjs");
const { check, validationResult } = require("express-validator");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");

const pageDao = require("./dao-pages");
const userDao = require("./dao-users");

const port = 3001;
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use("/static/images", express.static("public"));

const corsOptions = {
	origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
	credentials: true,
};
app.use(cors(corsOptions));

passport.use(
	new LocalStrategy(async function verify(username, password, callback) {
		const user = await userDao.getUser(username, password);
		if (!user) return callback(null, false, "Incorrect username or password");

		return callback(null, user);
	})
);

passport.serializeUser(function (user, callback) {
	callback(null, user);
});

passport.deserializeUser(function (user, callback) {
	return callback(null, user);
});

app.use(
	session({
		secret: "shhhhh... it's a secret!",
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.authenticate("session"));

const isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	return res.status(401).json({ error: "Not authorized" });
};

const isAuthorOrAdmin = async (req, res, next) => {
	const isAuthor = await pageDao
		.getPage(req.params.id)
		.then((page) => page.authorName == req.user.name + " " + req.user.surname)
		.catch(() => res.status(500).json({ error: "Invalid page id or user credentials" }));

	if (req.isAuthenticated() && (req.user.role == 1 || isAuthor)) {
		return next();
	}
	return res.status(401).json({ error: "Not authorized as an admin or as the author of the resource" });
};

const isAdmin = (req, res, next) => {
	if (req.isAuthenticated() && req.user.role == 1) {
		return next();
	}
	return res.status(401).json({ error: "Not authorized as an admin" });
};

/*** Users APIs ***/

// GET /api/users
app.get("/api/users", isLoggedIn, async (req, res) => {
	userDao
		.listUsers()
		.then((users) => {
			users = users.map((user) => {
				return { id: user.id, name: user.name, surname: user.surname, username: user.username, role: user.role };
			});

			res.status(200).json(users);
		})
		.catch((err) => res.status(500).json(err));
});

// POST /api/sessions
app.post("/api/sessions", function (req, res, next) {
	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (!user) {
			return res.status(401).json({ error: info });
		}
		req.login(user, (err) => {
			if (err) return next(err);
			return res.status(201).json(req.user);
		});
	})(req, res, next);
});

// GET /api/sessions/current
app.get("/api/sessions/current", isLoggedIn, (req, res) => {
	if (req.isAuthenticated()) {
		res.status(200).json(req.user);
	} else res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/session/current
app.delete("/api/sessions/current", (req, res) => {
	req.logout(() => {
		res.status(200).json({ message: "logged out successfully" });
	});
});

// GET /api/pages
app.get("/api/pages", async (req, res) => {
	pageDao
		.listPages()
		.then((pages) => {
			if (req.isUnauthenticated()) {
				res
					.status(200)
					.json(pages.filter((page) => page.publicationDate !== null && dayjs(page.publicationDate).isBefore(dayjs())));
			} else {
				res.status(200).json(pages);
			}
		})
		.catch((err) => res.status(500).json(err));
});

// GET /api/pages/:id
app.get(
	"/api/pages/:id",
	[check("id", "page id should be an integer greater than 0").isInt({ min: 1 })],
	async (req, res) => {
		pageDao
			.getPage(req.params.id)
			.then((page) => {
				if (req.isUnauthenticated()) {
					if (page.publicationDate !== null && dayjs(page.publicationDate).isBefore(dayjs())) {
						return res.status(200).json(page);
					} else {
						return res.status(401).json({ message: "Not authorized to access this resource" });
					}
				} else {
					return res.status(200).json(page);
				}
			})
			.catch((err) => {
				return res.status(500).json(err);
			});
	}
);

// POST /api/pages
app.post(
	"/api/pages",
	isLoggedIn,
	[
		check("page.title", "title should not be empty").trim().isLength({ min: 1, max: 160 }),
		check("page.creationDate", "creation date should be a string in the format YYYY-MM-DD")
			.trim()
			.isLength({ min: 10, max: 10 })
			.isDate({ format: "YYYY-MM-DD" }),
		check("page.publicationDate", "publication date should be a string in the format YYYY-MM-DD")
			.trim()
			.isLength({ min: 10, max: 10 })
			.isDate({ format: "YYYY-MM-DD" })
			.optional({ checkFalsy: true }),
		check("page.authorName", "author name should not be empty").trim().isLength({ min: 1, max: 160 }),

		check("content.*.type", "type should be: 0, 1, or 2").isInt({ min: 0, max: 2 }),
		check("content.*.data", "content should not be empty").trim().isLength({ min: 1 }),
		check("content.*.position", "position should be an integer greater than 0").isInt({ min: 0 }),
		check("content").custom((value) => {
			const header = value.some((c) => c.type === 0);
			const paragraph = value.some((c) => c.type === 1);
			const image = value.some((c) => c.type === 2);

			if (header && (paragraph || image)) return Promise.resolve();
			else return Promise.reject("A page must have at least a header and a paragraph or an image");
		}),
		check("content").custom((value) => {
			const positions = value.map((c) => c.position);
			const indexes = value.map((c, index) => index);

			positions.sort();
			indexes.sort();

			if (JSON.stringify(positions) === JSON.stringify(indexes)) return Promise.resolve();
			else return Promise.reject(`Content positions must be unique and sequential: ${positions.join(", ")}`);
		}),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				error: errors
					.array()
					.map((e) => e.msg)
					.join(", "),
			});
		}

		pageDao
			.createPage(req.body.page)
			.then((page) => {
				req.body.content.forEach((c) => {
					c.pageId = page.id;

					pageDao
						.createContent(c)
						.catch((err) =>
							res.status(500).json({ error: `Database error during the creation of new content: ${err}` })
						);
				});

				return res.status(201).json(page);
			})
			.catch((err) => res.status(500).json({ error: `Database error during the creation of new page: ${err}` }));
	}
);

// PUT /api/pages/:id
app.put(
	"/api/pages/:id",
	isAuthorOrAdmin,
	[
		check("id", "page id should be an integer greater than 0").isInt({ min: 1 }),
		check("page.id", "page id should be an integer greater than 0").isInt({ min: 1 }),
		check("page.title", "title should not be empty").trim().isLength({ min: 1, max: 160 }),
		check("page.creationDate", "creation date should be a string in the format YYYY-MM-DD")
			.trim()
			.isLength({ min: 10, max: 10 })
			.isDate({ format: "YYYY-MM-DD" }),
		check("page.publicationDate", "publication date should be a string in the format YYYY-MM-DD")
			.trim()
			.isLength({ min: 10, max: 10 })
			.isDate({ format: "YYYY-MM-DD" })
			.optional({ checkFalsy: true }),
		check("page.authorName", "author name should not be empty").trim().isLength({ min: 1, max: 160 }),

		check("oldIds.*", "content id should be an integer greater than 0").isInt({ min: 1 }),

		check("content.*.id", "content id should be an integer greater than 0").isInt({ min: 1 }),
		check("content.*.type", "type should be: 0, 1, or 2").isInt({ min: 0, max: 2 }),
		check("content.*.data", "content should not be empty").trim().isLength({ min: 1 }),
		check("content.*.position", "position should be an integer greater than 0").isInt({ min: 0 }),
		check("content").custom((value) => {
			const header = value.some((c) => c.type === 0);
			const paragraph = value.some((c) => c.type === 1);
			const image = value.some((c) => c.type === 2);

			if (header && (paragraph || image)) return Promise.resolve();
			else return Promise.reject("A page must have at least a header and a paragraph or an image");
		}),
		check("content").custom((value) => {
			const positions = value.map((c) => c.position);
			const indexes = value.map((c, index) => index);

			positions.sort();
			indexes.sort();

			if (JSON.stringify(positions) === JSON.stringify(indexes)) return Promise.resolve();
			else return Promise.reject(`Content positions must be unique and sequential: ${positions.join(", ")}`);
		}),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				error: errors
					.array()
					.map((e) => e.msg)
					.join(", "),
			});
		}

		if (req.body.page.id !== Number(req.params.id)) {
			return res.status(422).json({ error: "URL and body id mismatch" });
		}

		pageDao
			.updatePage(req.body.page)
			.then(() => {
				req.body.oldIds.forEach((o) => {
					pageDao
						.deleteContent(o)
						.catch((err) =>
							res.status(500).json({ error: `Database error during the deletion of new content: ${err}` })
						);
				});

				req.body.content.forEach((c) => {
					pageDao
						.createContent(c)
						.catch((err) =>
							res.status(500).json({ error: `Database error during the creation of new content: ${err}` })
						);
				});
			})
			.catch((err) =>
				res.status(500).json({ error: `Database error during the update of page ${req.params.id}: ${err}` })
			);

		return res.status(201).json({ message: "page updated successfully" });
	}
);

// DELETE /api/pages/:id
app.delete(
	"/api/pages/:id",
	isAuthorOrAdmin,
	[check("id", "page id should be an integer greater than 0").isInt({ min: 1 })],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				error: errors
					.array()
					.map((e) => e.msg)
					.join(", "),
			});
		}

		const pageContents = await pageDao.getPageContents(req.params.id);

		pageDao
			.deletePage(req.params.id)
			.then(() => {
				pageContents.forEach((c) => {
					pageDao
						.deleteContent(c.id)
						.catch((err) =>
							res.status(500).json({ error: `Database error during the deletion of new content: ${err}` })
						);
				});
			})
			.catch((err) =>
				res.status(500).json({ error: `Database error during the deletion of page ${req.params.id}: ${err}` })
			);

		return res.status(200).json({ message: "page deleted successfully" });
	}
);

// GET /api/pages/:id/contents
app.get("/api/pages/:id/contents", async (req, res) => {
	pageDao
		.getPageContents(req.params.id)
		.then((contents) => res.status(200).json(contents))
		.catch((err) => res.status(500).json(err));
});

// GET /api/title
app.get("/api/title", async (req, res) => {
	pageDao
		.getTitle()
		.then((title) => res.status(200).json(title))
		.catch((err) => res.status(500).json(err));
});

// PUT /api/title
app.put(
	"/api/title",
	isAdmin,
	[check("title", "title should not be empty").trim().isLength({ min: 1 })],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				error: errors
					.array()
					.map((e) => e.msg)
					.join(", "),
			});
		}

		pageDao
			.setTitle(req.body.title)
			.then((title) => res.status(201).json(title))
			.catch((err) => res.status(500).json(err));
	}
);

// activate the server
app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
