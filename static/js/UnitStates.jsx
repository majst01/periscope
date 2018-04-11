'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, ButtonGroup } from 'reactstrap';
import { ServiceState } from './UnitState.jsx';

export default class UnitStates extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        let unitStates = (
            <div>No States yet</div>
        )
        if (Object.keys(this.props.states).length != 0) {
            unitStates = Object.keys(this.props.states).map((key, i) => {
                return (
                    <Button color={ServiceState[key]} style={{ margin: 1 }} key={i}>{key}: {this.props.states[key]}</Button>
                )
            });
        }
        return (
            <ButtonGroup size="sm" aria-label="Unit States">
                {unitStates}
            </ButtonGroup>
        );
    }
}
