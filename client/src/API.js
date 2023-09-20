"use strict";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const SERVER_URL = "http://localhost:3001/api/";

function getJson(httpResponsePromise) {
	return new Promise((resolve, reject) => {
		httpResponsePromise
			.then((response) => {
				if (response.ok) {
					response
						.json()
						.then((json) => resolve(json))
						.catch((err) => reject({ error: "Cannot parse server response" }));
				} else {
					response
						.json()
						.then((obj) => reject(obj))
						.catch((err) => reject({ error: "Cannot parse server response" }));
				}
			})
			.catch((err) => reject({ error: "Cannot communicate" }));
	});
}

const getPages = async () => {
	return getJson(fetch(SERVER_URL + "pages", { credentials: "include" })).then((json) => {
		return json.map((page) => {
			const clientPage = {
				id: page.id,
				title: page.title,
				creationDate: page.creationDate,
				publicationDate: page.publicationDate,
				authorName: page.authorName,
			};
			if (page.creationDate) clientPage.creationDate = dayjs(page.creationDate);
			if (page.publicationDate) clientPage.publicationDate = dayjs(page.publicationDate);

			return clientPage;
		});
	});
};

const getPage = async (id) => {
	return getJson(fetch(SERVER_URL + "pages/" + id, { credentials: "include" })).then((page) => {
		const clientPage = {
			id: page.id,
			title: page.title,
			creationDate: page.creationDate,
			publicationDate: page.publicationDate,
			authorName: page.authorName,
		};
		if (page.creationDate) clientPage.creationDate = dayjs(page.creationDate);
		if (page.publicationDate) clientPage.publicationDate = dayjs(page.publicationDate);

		return clientPage;
	});
};

const addPage = async (page, pageContent) => {
	return getJson(
		fetch(SERVER_URL + "pages/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ page: page, content: pageContent }),
		})
	);
};

const updatePage = async (page, oldPageContentIds, newPageContent) => {
	return getJson(
		fetch(SERVER_URL + "pages/" + page.id, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ page: page, oldIds: oldPageContentIds, content: newPageContent }),
		})
	);
};

const deletePage = async (id) => {
	return getJson(
		fetch(SERVER_URL + "pages/" + id, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		})
	);
};

const getPageContent = async (id) => {
	return getJson(fetch(SERVER_URL + "pages/" + id + "/contents", { credentials: "include" })).then((page) => {
		return page;
	});
};

const getWebsiteTitle = async () => {
	return getJson(fetch(SERVER_URL + "title", { credentials: "include" })).then((title) => {
		return title;
	});
};

const setWebsiteTitle = async (title) => {
	return getJson(
		fetch(SERVER_URL + "title/", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(title),
		})
	);
};

const logIn = async (credentials) => {
	return getJson(
		fetch(SERVER_URL + "sessions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(credentials),
		})
	);
};

const getUserInfo = async () => {
	return getJson(
		fetch(SERVER_URL + "sessions/current", {
			credentials: "include",
		})
	);
};

const getUsers = async () => {
	return getJson(fetch(SERVER_URL + "users", { credentials: "include" })).then((json) => {
		return json.map((user) => {
			const clientUser = {
				id: user.id,
				email: user.username,
				name: user.name,
				surname: user.surname,
				role: user.role,
			};

			return clientUser;
		});
	});
};

const logOut = async () => {
	return getJson(
		fetch(SERVER_URL + "sessions/current", {
			method: "DELETE",
			credentials: "include",
		})
	);
};

const API = {
	getPages,
	getPage,
	addPage,
	updatePage,
	deletePage,

	getPageContent,

	getWebsiteTitle,
	setWebsiteTitle,

	logIn,
	getUsers,
	getUserInfo,
	logOut,
};
export default API;
