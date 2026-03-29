import React from 'react';
import '../index.css';

const Hero = () => {
    return (
        <div className="text-center custom-padding">
            <strong><h1><b>TTC Service Analyzer</b></h1></strong>
            <div className="container">
                <p className="text-center mx-5 py-2">Upload a zip file of TTC wait-time data to explore delays and patterns across the network.</p>
                <div className="row justify-content-center align-items-center">
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 bg-warning bg-opacity-10 border border-danger rounded p-3 m-2 colheight">
                        <div className='pb-2'>
                            <i class="bi bi-file-zip h1"></i>
                        </div>
                        <p>Provide your dataset as a zip archive; the app will unpack and parse the files you need for analysis.</p>
                    </div>
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 bg-warning bg-opacity-10 border border-danger rounded p-3 m-2 colheight">
                        <div className='pb-2'>
                            <i class="bi bi-clock-history h1"></i>
                        </div>
                        <p>Review wait times by route, stop, or time of day once your data is loaded.</p>
                    </div>
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 bg-warning bg-opacity-10 border border-danger rounded p-3 m-2 colheight">
                        <div className='pb-2'>
                            <i class="bi bi-map h1"></i>
                        </div>
                        <p>Use the map to see where waits concentrate and how they relate to the rest of the system.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Hero;
