"use strict";

const db = require("./db");

/** NOTE:
 * return error messages as json object { error: <string> }
 */

exports.getTitle = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM title";
		db.get(sql, [], (err, row) => {
			if (err) {
				reject(err);
			}

			resolve(row.title);
		});
	});
};

exports.setTitle = (title) => {
	return new Promise((resolve, reject) => {
		const sql = "UPDATE title SET title = ?";
		db.run(sql, [title], function (err) {
			if (err) {
				reject(err);
			}

			resolve(exports.getTitle());
		});
	});
};

exports.listPages = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM page";
		db.all(sql, [], (err, rows) => {
			if (err) {
				reject(err);
			}

			const pages = rows.map((e) => {
				const page = Object.assign({}, e);
				return page;
			});

			resolve(pages);
		});
	});
};

exports.getPage = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM page WHERE id = ?";
		db.get(sql, [id], (err, row) => {
			if (err) {
				reject(err);
			}

			const page = Object.assign({}, row);
			resolve(page);
		});
	});
};

exports.createPage = (page) => {
	return new Promise((resolve, reject) => {
		const sql = "INSERT INTO page (title, creationDate, publicationDate, authorName) VALUES (?, ?, ?, ?)";
		db.run(sql, [page.title, page.creationDate, page.publicationDate, page.authorName], function (err) {
			if (err) {
				reject(err);
			}

			resolve(exports.getPage(this.lastID));
		});
	});
};

exports.updatePage = (page) => {
	return new Promise((resolve, reject) => {
		const sql = "UPDATE page SET title = ?, creationDate = ?, publicationDate = ?, authorName = ? WHERE id = ?";
		db.run(sql, [page.title, page.creationDate, page.publicationDate, page.authorName, page.id], function (err) {
			if (err) {
				reject(err);
			}

			resolve(exports.getPage(page.id));
		});
	});
};

exports.deletePage = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "DELETE FROM page WHERE id = ?";
		db.run(sql, [id], function (err) {
			if (err) {
				reject(err);
			}

			resolve(null);
		});
	});
};

exports.getContent = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM content WHERE id = ?";
		db.get(sql, [id], (err, row) => {
			if (err) {
				reject(err);
			}

			const content = Object.assign({}, row);
			resolve(content);
		});
	});
};

exports.createContent = (content) => {
	return new Promise((resolve, reject) => {
		const sql = "INSERT INTO content (type, data, position, pageId) VALUES (?, ?, ?, ?)";
		db.run(sql, [content.type, content.data, content.position, content.pageId], function (err) {
			if (err) {
				reject(err);
			}

			resolve(exports.getContent(this.lastID));
		});
	});
};

exports.updateContent = (content) => {
	return new Promise((resolve, reject) => {
		const sql = "UPDATE content SET type = ?, data = ?, position = ?, pageId = ? WHERE id = ?";
		db.run(sql, [content.type, content.data, content.position, content.pageId, content.id], function (err) {
			if (err) {
				reject(err);
			}

			resolve(exports.getContent(content.id));
		});
	});
};

exports.deleteContent = (id) => {
	return new Promise((resolve, reject) => {
		const sql = "DELETE FROM content WHERE id = ?";
		db.run(sql, [id], function (err) {
			if (err) {
				reject(err);
			}

			resolve(null);
		});
	});
};

exports.getPageContents = (pid) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM content WHERE pageId = ?";
		db.all(sql, [pid], (err, rows) => {
			if (err) {
				reject(err);
			}

			const page_content = rows.map((e) => {
				const content = Object.assign({}, e);
				return exports.getContent(content.id);
			});

			resolve(Promise.all(page_content));
		});
	});
};
