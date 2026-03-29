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
          <b>TTC Service Analyzer</b>
        </NavbarBrand>
        <div>
          <Button color="danger" tag={Link} to="/about">About</Button>{" "}        
        </div>
      </Navbar>
    </div>
  );
};

export default Navigation;
