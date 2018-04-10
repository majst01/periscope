
'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, ButtonGroup } from 'reactstrap';

const ServiceState = {
  loaded: "success",
  active: "success",
  inactive: "warning",
  dead: "danger",
  running: "success",
  mounted: "success",
  waiting: "warning",
  failed: "danger",
  exited: "success",
  elapsed: "success",
  listening: "success",
  plugged: "success",
  "not-found": "primary"
}

export default class UnitState extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ButtonGroup size="sm" aria-label="Unit Status">
        <Button color={ServiceState[this.props.Unit.LoadState]}>{this.props.Unit.LoadState}</Button>
        <Button color={ServiceState[this.props.Unit.ActiveState]} >{this.props.Unit.ActiveState}</Button>
        <Button color={ServiceState[this.props.Unit.SubState]} >{this.props.Unit.SubState}</Button>
      </ButtonGroup>
    )
  }
}
