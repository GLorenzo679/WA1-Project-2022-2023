import "bootstrap-icons/font/bootstrap-icons.css";

import { React } from "react";
import { Navbar, Nav, Dropdown, DropdownButton, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { LogoutButton, LoginButton } from "./Auth";

const Navigation = (props) => {
	return (
		<Navbar bg="primary" expand="sm" variant="dark" fixed="top" className="navbar-padding">
			<Link to="/" className="col-6">
				<Button onClick={() => props.setOffice("Front Office")}>
					<Navbar.Brand>
						<i className="bi bi-database-fill-gear"> {props.title} </i>
					</Navbar.Brand>
				</Button>
			</Link>
			<Nav className="col-6 d-flex justify-content-end">
				<Navbar.Text className="navbar-login-text">
					{props.user && props.user.name && `Welcome, ${props.user.name}!`}
				</Navbar.Text>
				{props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
				&nbsp;
				{props.loggedIn && <OfficeButton office={props.office} setOffice={props.setOffice} />}
			</Nav>
		</Navbar>
	);
};

const OfficeButton = (props) => {
	return (
		<DropdownButton id="dropdown-basic-button" title={props.office}>
			<Dropdown.Item as={Link} to="/" onClick={() => props.setOffice("Front Office")}>
				Front Office
			</Dropdown.Item>
			<Dropdown.Item as={Link} to="/back-office" onClick={() => props.setOffice("Back Office")}>
				Back Office
			</Dropdown.Item>
		</DropdownButton>
	);
};

export { Navigation };
