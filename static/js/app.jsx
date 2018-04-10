'use strict';
import React from 'react';
import ReactDOM from 'react-dom';

import SplitPane from 'react-split-pane';
import { LazyLog } from 'react-lazylog';
import UnitsList from './UnitsList.jsx';

import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import './app.css';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            consoleVisible: false,
            serviceName: ""
        };
        this.showConsole = this.showConsole.bind(this)
        this.escFunction = this.escFunction.bind(this);
    }

    escFunction(event) {
        if (event.keyCode === 27) {
            this.setState({ consoleVisible: false })
            document.removeEventListener("keydown", this.escFunction, false);
        }
    }

    showConsole(name) {
        if (this.state.serviceName === name && this.state.consoleVisible === true) {
            return
        }

        this.setState({
            serviceName: name,
            consoleVisible: true
        })
        document.addEventListener("keydown", this.escFunction, false);
    }

    render() {
        var s = { 'display': 'none' }
        var size = '0%'
        var rs = { 'height': 0 }

        if (this.state.consoleVisible === true) {
            s = { 'overflowX': 'hidden !important' }
            size = '25%'
            rs = {}
        }

        return (
            <SplitPane
                split="horizontal"
                primary="second"
                defaultSize={size}
                pane1Style={{ 'overflowY': 'scroll' }}
                resizerStyle={rs}>

                <UnitsList showConsole={this.showConsole} />
                <LazyLog
                    url={"/journal?name=" + this.state.serviceName}
                    stream
                    selectableLines
                    follow
                    style={s} />
            </SplitPane>
        )
    }
}

ReactDOM.render(<App />, document.querySelector("#units"));
