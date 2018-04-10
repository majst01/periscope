'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, ButtonGroup, ButtonToolbar } from 'reactstrap';
import UnitState from './UnitState.jsx';

export default class UnitsItem extends React.Component {
  render() {
    let buttonGroup = (
      <td>
        <ButtonToolbar>
          <ButtonGroup size="sm" aria-label="Unit Actions">
            <Button color="danger" onClick={this.doUnit(this.props.Unit.Name, "stop")}>Stop</Button>
            <Button color="success" onClick={this.doUnit(this.props.Unit.Name, "start")}>Start</Button>
            <Button color="warning" onClick={this.doUnit(this.props.Unit.Name, "restart")}>Restart</Button>
          </ButtonGroup>
          <ButtonGroup size="sm" style={{ 'marginLeft': '5px' }}>
            <Button color="info" onClick={this.doUnit(this.props.Unit.Name, "describe")}>View Journal</Button>
          </ButtonGroup>
        </ButtonToolbar>
      </td>
    )
    if (this.props.readonly) {
      buttonGroup = null
    }
    return (
      <tr>
        <td>
          <span className="d-inline-block text-truncate" style={{ "maxWidth": "500px" }}>{this.props.Unit.Description}</span>
        </td>
        <td>
          <span className="d-inline-block text-truncate" style={{ "maxWidth": "500px" }}>
            <a href="#" className="badge badge-light" onClick={this.doUnit(this.props.Unit.Name, "describe")}>{this.props.Unit.Name}</a>
          </span>
        </td>
        <td>
          <UnitState Unit={this.props.Unit} />
        </td>
        {buttonGroup}
      </tr>
    );
  }
  doUnit(name, action) {
    return (e) => {
      this.props.onUnitClicked(name, action)
    }
  }
}