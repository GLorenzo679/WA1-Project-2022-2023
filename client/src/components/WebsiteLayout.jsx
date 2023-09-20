import { React, useContext, useState, useEffect } from "react";
import { Row, Col, Button, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams, Outlet } from "react-router-dom";

import dayjs from "dayjs";

import PageTable from "./Pages";
import PageForm from "./PageForm";
import MessageContext from "../contexts/messageCtx";
import InfoContext from "../contexts/infoCtx";
import API from "../API";
import { LoginForm } from "./Auth";
import PageContent from "./SinglePage";
import WebsiteTitle from "./WebsiteTitle";

function DefaultLayout() {
	return (
		<Row className="vh-100">
			<Col className="below-nav mx-8">
				<Outlet />
			</Col>
		</Row>
	);
}

function FrontOfficeLayout(props) {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const getPages = async () => {
			setLoading(true);
			const response = await API.getPages();
			const pages = await response;
			props.setPages(
				props.loggedIn
					? pages.filter((page) => page.publicationDate !== null && dayjs(page.publicationDate).isBefore(dayjs()))
					: pages.sort((a, b) => {
							return a.publicationDate > b.publicationDate ? 1 : -1;
					  })
			);
			setLoading(false);
		};

		getPages();
	}, [props.loggedIn]);

	return (
		<>
			{loading && <Spinner animation="border" />}
			{!loading && <PageTable pages={props.pages} />}
		</>
	);
}

function SinglePageLayout(props) {
	const { id } = useParams();
	const { handleErrors } = useContext(MessageContext);
	const [content, setContent] = useState([]);
	const [page, setPage] = useState(null);
	const [loading, setLoading] = useState(true);
	const [dirty, setDirty] = useState(true);

	useEffect(() => {
		const getPage = async () => {
			try {
				setLoading(true);
				const response = await API.getPage(id);
				setPage(response);
				setLoading(false);
			} catch (err) {
				handleErrors(err);
			}
		};

		getPage();
	}, []);

	useEffect(() => {
		const getPageContent = async () => {
			try {
				setLoading(true);
				const response = await API.getPageContent(id);
				const content = await response;
				setContent(content.sort((a, b) => (a.position > b.position ? 1 : -1)));
				setLoading(false);
				setDirty(false);
			} catch (err) {
				handleErrors(err);
			}
		};

		getPageContent();
	}, [dirty]);

	return (
		<>
			{loading && <Spinner animation="border" />}
			{!loading && <PageContent office={props.office} page={page} content={content} />}
		</>
	);
}

function BackOfficeLayout(props) {
	const [loading, setLoading] = useState(true);
	const [pages, setPages] = useState(props.pages);
	const [dirty, setDirty] = useState(false);
	const { handleErrors } = useContext(MessageContext);
	const { handleInfo } = useContext(InfoContext);

	useEffect(() => {
		setLoading(true);
		const getPages = async () => {
			const response = await API.getPages();
			const pages = await response;
			setPages(pages);
			setDirty(false);
			setLoading(false);
		};

		getPages();
	}, [dirty, props.dirty]);

	const changeTitle = async (title) => {
		await API.setWebsiteTitle({ title: title })
			.then((t) => {
				props.setTitle(t);
				handleInfo("Website title changed successfully!");
			})
			.catch((e) => handleErrors(e));
	};

	const deletePage = async (pid) => {
		try {
			await API.deletePage(pid).then(() => handleInfo("Page deleted successfully!"));
			setDirty(true);
		} catch (err) {
			handleErrors(err);
		}
	};

	return (
		<>
			{props.admin ? <WebsiteTitle title={props.title} changeTitle={changeTitle} /> : null}
			{loading && <Spinner animation="border" />}
			{!loading && (
				<PageTable
					deletePage={deletePage}
					admin={props.admin}
					username={props.username}
					pages={pages}
					office={props.office}
				/>
			)}
		</>
	);
}

function AddLayout(props) {
	const { handleErrors } = useContext(MessageContext);
	const { handleInfo } = useContext(InfoContext);
	const [content, setContent] = useState([]);
	const navigate = useNavigate();

	const addPage = async (page, pageContent) => {
		try {
			props.setDirty(true);
			pageContent.map((c) => {
				c.position = pageContent.indexOf(c);
			});

			await API.addPage(page, pageContent).then(() => handleInfo("Page added successfully!"));
			props.setDirty(false);
			navigate("/back-office");
		} catch (err) {
			handleErrors(err);
		}
	};

	return (
		<>
			<h1 className="pb-3">Add Page:</h1>
			<PageForm admin={props.admin} addPage={addPage} user={props.user} content={content} setContent={setContent} />
		</>
	);
}

function EditLayout(props) {
	const { handleErrors } = useContext(MessageContext);
	const { handleInfo } = useContext(InfoContext);

	const { id } = useParams();
	const [page, setPage] = useState(null);
	const [content, setContent] = useState([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const getPage = async () => {
			setLoading(true);
			await API.getPage(id)
				.then((p) => {
					setPage(p);
					setLoading(false);
				})
				.catch((e) => {
					handleErrors(e);
				});
		};

		getPage();
	}, []);

	useEffect(() => {
		const getPageContent = async () => {
			try {
				setLoading(true);
				const response = await API.getPageContent(id);
				const content = await response;
				setContent(content.sort((a, b) => (a.position > b.position ? 1 : -1)));
				setLoading(false);
			} catch (err) {
				handleErrors(err);
			}
		};

		getPageContent();
	}, []);

	const editPage = async (page, pageContent) => {
		try {
			props.setDirty(true);
			pageContent.map((content) => {
				content.position = pageContent.indexOf(content);
				content.pageId = page.id;
			});

			const oldIds = await API.getPageContent(page.id).then((response) => response.map((c) => c.id));
			await API.updatePage(page, oldIds, pageContent).then(() => handleInfo("Page updated successfully!"));
			props.setDirty(false);
			navigate("/back-office");
		} catch (err) {
			handleErrors(err);
		}
	};

	return page ? (
		<>
			<h1 className="pb-3">Edit Page:</h1>
			{!loading && (
				<PageForm admin={props.admin} page={page} editPage={editPage} content={content} setContent={setContent} />
			)}
		</>
	) : (
		<></>
	);
}

function NotFoundLayout() {
	return (
		<>
			<h2>This is not the route you are looking for!</h2>
			<Link to="/">
				<div className="d-flex justify-content-center">
					<Button variant="primary" className="btn-lg mt-3">
						Go Home!
					</Button>
				</div>
			</Link>
		</>
	);
}

function LoadingLayout() {
	return (
		<Row className="vh-100">
			<Col md={4} bg="light" className="below-nav" id="left-sidebar"></Col>
			<Col md={8} className="below-nav">
				<h1>Loading ...</h1>
			</Col>
		</Row>
	);
}

function LoginLayout(props) {
	return (
		<Row className="vh-100">
			<Col md={12} className="below-nav">
				<LoginForm login={props.login} />
			</Col>
		</Row>
	);
}

export {
	DefaultLayout,
	FrontOfficeLayout,
	SinglePageLayout,
	BackOfficeLayout,
	AddLayout,
	EditLayout,
	NotFoundLayout,
	LoadingLayout,
	LoginLayout,
};
