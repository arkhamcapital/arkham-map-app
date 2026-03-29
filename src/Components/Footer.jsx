// imports
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "../index.css";

// footer component
const Footer = () => {
    return (
        // d-flex and flex-column enables a hierarchical layout from top to bottom
        <div className='d-flex flex-column'>
            {/* svg with styles for browser size */}
            <svg id="visual" viewBox="0 0 900 160" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" className="layer spacer">
            </svg>
            {/* fixed footer */}
            <div className="navbar-fixed-bottom">
                <footer className="text-center text-lg-start about-footer">
                    <div className="text-center px-5 pb-5 bg-dark text-white">
                        <p className="mb-2">TTC Service Gap Analyzer</p>
                        <p className="mb-2">
                            <a href="https://arkhamsystems.vercel.app/" target="_blank" rel="noreferrer">
                                Arkham Systems
                            </a>
                        </p>
                        <p className="mb-0">
                            <a href="https://x.com/rarascode" target="_blank" rel="noreferrer">
                                rarascode
                            </a>
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}


export default Footer;
