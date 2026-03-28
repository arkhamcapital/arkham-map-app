// imports
import React from "react";
import { Navbar, NavbarBrand, Button } from "reactstrap";
import { Link } from "react-router-dom";

// navigation component
const Navigation = () => {
  return (
    // navbar styles
    <div>
      <Navbar className="py-2" color="dark" dark fixed="top">
        {/* brand links home */}
        <NavbarBrand href="/">
          {/* logo styles */}
          <img
            alt="logo"
            src="/Assets/logo.png"
            style={{
              height: 40,
              width: 40,
            }}
            className="mx-2"
          />
          <b>TTC Wait Times</b>
        </NavbarBrand>
        <div>
          {/* React router link to the about page */}
          <Button color="danger" tag={Link} to="/about">About</Button>{" "}
          {/* external link to blog */}
          {/* noreferrer adds extra security so the linked page does not know which site you came from */}
          <a href="https://a8d.vercel.app/" target="_blank" rel="noreferrer">
            <Button color="warning">Blog</Button>
          </a>
        </div>
      </Navbar>
    </div>
  );
};

export default Navigation;
