import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { React, useState, useEffect } from "react";
import { Container, Modal, Button, Toast } from "react-bootstrap/";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Navigation } from "./components/Navigation";
import {
	DefaultLayout,
	NotFoundLayout,
	LoginLayout,
	LoadingLayout,
	FrontOfficeLayout,
	SinglePageLayout,
	BackOfficeLayout,
	AddLayout,
	EditLayout,
} from "./components/WebsiteLayout";

import MessageContext from "./contexts/messageCtx";
import InfoContext from "./contexts/infoCtx";
import API from "./API";

function App() {
	const [pages, setPages] = useState([]);
	const [office, setOffice] = useState("Front Office");
	const [loggedIn, setLoggedIn] = useState(false);
	const [admin, setAdmin] = useState(false);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [info, setInfo] = useState("");
	const [title, setTitle] = useState("");
	const [dirty, setDirty] = useState(true);

	const handleErrors = (err) => {
		let msg = "";
		if (err.error) msg = err.error;
		else if (String(err) === "string") msg = String(err);
		else msg = "Unknown Error";
		setMessage(msg);
	};

	const handleInfo = (msg) => {
		setInfo(msg);
	};

	useEffect(() => {
		const init = async () => {
			try {
				setLoading(true);
				const websiteTitle = await API.getWebsiteTitle();
				setTitle(websiteTitle);
				const user = await API.getUserInfo();
				setUser(user);
				setAdmin(user.role == 1);
				setLoggedIn(true);
				setLoading(false);
			} catch (err) {
				setUser(null);
				setAdmin(false);
				setLoggedIn(false);
				setLoading(false);
			}
		};
		init();
	}, []);

	const handleLogin = async (credentials) => {
		try {
			const user = await API.logIn(credentials);
			setUser(user);
			setAdmin(user.role == 1);
			setLoggedIn(true);
		} catch (err) {
			throw err;
		}
	};

	const handleLogout = async () => {
		await API.logOut();
		setLoggedIn(false);
		// clean up everything
		setUser(null);
		setAdmin(false);
		setPages([]);
		setOffice("Front Office");
	};

	return (
		<BrowserRouter>
			<MessageContext.Provider value={{ handleErrors }}>
				<InfoContext.Provider value={{ handleInfo }}>
					<Container fluid className="App">
						<Navigation
							title={title}
							logout={handleLogout}
							user={user}
							loggedIn={loggedIn}
							office={office}
							setOffice={setOffice}
						/>

						<Routes>
							<Route path="/" element={loading ? <LoadingLayout /> : <DefaultLayout />}>
								<Route
									index
									element={<FrontOfficeLayout loggedIn={loggedIn} pages={pages} setPages={setPages} office={office} />}
								/>
								<Route path="pages/:id" element={<SinglePageLayout office={office} />} />

								<Route path="/back-office/">
									<Route
										index
										element={
											<BackOfficeLayout
												username={loggedIn ? user.name + " " + user.surname : null}
												admin={admin}
												title={title}
												setTitle={setTitle}
												pages={pages}
												setPages={setPages}
												office={office}
												dirty={dirty}
											/>
										}
									/>
									<Route
										path="add"
										element={
											loggedIn ? (
												<AddLayout dirty={dirty} setDirty={setDirty} admin={admin} user={user} />
											) : (
												<Navigate replace to="/login" />
											)
										}
									/>
									<Route
										path="pages/:id/edit/"
										element={
											loggedIn ? (
												<EditLayout dirty={dirty} setDirty={setDirty} admin={admin} user={user} />
											) : (
												<Navigate replace to="/login" />
											)
										}
									/>
								</Route>

								<Route path="*" element={<NotFoundLayout />} />
							</Route>
							<Route
								path="/login"
								element={!loggedIn ? <LoginLayout login={handleLogin} /> : <Navigate replace to="/" />}
							/>
						</Routes>

						<Modal show={message !== ""}>
							<Modal.Header>
								<Modal.Title>Error:</Modal.Title>
							</Modal.Header>
							<Modal.Body>{message}</Modal.Body>
							<Modal.Footer>
								<Button variant="primary" onClick={() => setMessage("")}>
									Understood
								</Button>
							</Modal.Footer>
						</Modal>

						<Toast show={info !== ""} onClose={() => setInfo("")} bg="info" delay={4000} autohide>
							<Toast.Body>{info}</Toast.Body>
						</Toast>
					</Container>
				</InfoContext.Provider>
			</MessageContext.Provider>
		</BrowserRouter>
	);
}

export default App;
