"use strict";

const db = require("./db");
const crypto = require("crypto");

exports.listUsers = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM user";
		db.all(sql, [], (err, rows) => {
			if (err) {
				reject(err);
			} else if (rows === undefined) {
				resolve(false);
			} else {
				const users = rows.map((e) => {
					const user = Object.assign({}, e);
					return { id: user.id, username: user.email, name: user.name, surname: user.surname, role: user.role };
				});

				resolve(users);
			}
		});
	});
};

exports.getUser = (email, password) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM user WHERE email=?";
		db.get(sql, [email], (err, row) => {
			if (err) {
				reject(err);
			} else if (row === undefined) {
				resolve(false);
			} else {
				const user = { id: row.id, username: row.email, name: row.name, surname: row.surname, role: row.role };

				crypto.scrypt(password, row.salt, 64, function (err, hashedPassword) {
					if (err) reject(err);
					if (!crypto.timingSafeEqual(Buffer.from(row.password, "hex"), hashedPassword)) resolve(false);
					else resolve(user);
				});
			}
		});
	});
};
