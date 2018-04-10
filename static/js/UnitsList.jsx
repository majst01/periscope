'use strict';
import React from 'react';
import ReactDOM from 'react-dom';

import axios from 'axios';
import { Card, CardHeader, CardBody,
         Container, Form, Input,
         Navbar, NavbarBrand, Table } from 'reactstrap';

import UnitsItem from './UnitsItem.jsx';

const SortOrder = {
  NAME_ASC: 1,
  NAME_DESC: 2,
  DESCRIPTION_ASC: 3,
  DESCRIPTION_DESC: 4,
  STATE_ASC: 5,
  STATE_DESC: 6
}

export default class UnitsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      units: [],
      readonly: false,
      filterString: "",
      sortBy: SortOrder.NAME_ASC
    };
  }

  componentDidMount() {
    this.getUnits()
    this.getReadonly()
    window.setInterval(() => { this.getUnits() }, 5000)
  }

  getUnits() {
    axios
      .get("/units")
      .then((result) => {
        console.log(result)
        this.setState({ units: result.data.Units });
      });
  }

  getReadonly() {
    axios
      .get("/readonly")
      .then((result) => {
        console.log("readonly:" + result)
        this.setState({ readonly: result });
      });
  }

  onUnitClicked(name, action) {
    console.log(action, ' unit:', name, ' readonly:', this.state.readonly);
    if (this.state.readonly.data) {
      return
    }
    if (action == "describe") {
      console.log('describe:', name)
      this.props.showConsole(name)
    }

    axios
      .get("/unit", {
        params: {
          name: name,
          action: action
        }
      })
      .then((response) => {
        console.log(response)
        this.getUnits()
      });
  }

  onFilter(e) {
    this.setState({ filterString: e.target.value })
  }

  toggleSortBy(a, b) {
    if (this.state.sortBy == a) {
      this.setState({ sortBy: b })
    } else if (this.state.sortBy == b) {
      this.setState({ sortBy: a })
    } else {
      this.setState({ sortBy: a })
    }
  }

  toggleSortOrder(field) {
    console.log("toggle:", field)
    switch (field) {
      case "name":
        this.toggleSortBy(SortOrder.NAME_ASC, SortOrder.NAME_DESC)
        break;
      case "description":
        this.toggleSortBy(SortOrder.DESCRIPTION_ASC, SortOrder.DESCRIPTION_DESC)
      break;
      case "state":
        this.toggleSortBy(SortOrder.STATE_ASC, SortOrder.STATE_DESC)
        break;
      default:
        break;
    }
  }

  sortStringsOnLowerCase(a, b, reverse) {
    if (!reverse) {
      if (a.toLowerCase() < b.toLowerCase()) return -1;
      if (a.toLowerCase() > b.toLowerCase()) return 1;
    } else {
      if (a.toLowerCase() < b.toLowerCase()) return 1;
      if (a.toLowerCase() > b.toLowerCase()) return -1;
    }
  }

  render() {
    const units = this.state.units.filter(unit => {
      return this.state.filterString.length < 3 || unit.Name.indexOf(this.state.filterString) >= 0
    }).sort((a, b) => {
      switch (this.state.sortBy) {
        case SortOrder.NAME_ASC:
          return this.sortStringsOnLowerCase(a.Name, b.Name, false)
          break;
        case SortOrder.NAME_DESC:
          return this.sortStringsOnLowerCase(a.Name, b.Name, true)
          break;
        case SortOrder.DESCRIPTION_ASC:
          return this.sortStringsOnLowerCase(a.Description, b.Description, false)
          break;
        case SortOrder.DESCRIPTION_DESC:
          return this.sortStringsOnLowerCase(a.Description, b.Description, true)
          break;
        case SortOrder.STATE_ASC:
          return this.sortStringsOnLowerCase(a.SubState, b.SubState, false)
          break;
        case SortOrder.STATE_DESC:
        return this.sortStringsOnLowerCase(a.SubState, b.SubState, true)
          break;

        default:
          break;
      }
      return 0;
    }).map((unit, i) => {
        return (
          <UnitsItem key={i}
            Unit={unit}
            onUnitClicked={this.onUnitClicked.bind(this)}
            readonly={this.state.readonly.data} />
        );
      });

    let actionHeader = (
      <th scope="col">Action</th>
    )
    if (this.state.readonly.data) (
      actionHeader = null
    )

    return (
      <React.StrictMode>
      <Container fluid>
        <Navbar color="light" light expand="lg">
          <NavbarBrand href="#">Systemd Units</NavbarBrand>
          <Form>
            <Input
              type="search"
              placeholder="Filter Service"
              id="filter"
              value={this.state.filterString}
              onChange={this.onFilter.bind(this)}></Input>
          </Form>
        </Navbar>
        <Table hover size="sm">
          <thead className="thead-dark">
            <tr>
              <th scope="col" onClick={this.toggleSortOrder.bind(this, "description")} >Description</th>
              <th scope="col" onClick={this.toggleSortOrder.bind(this, "name")} >Name</th>
              <th scope="col" onClick={this.toggleSortOrder.bind(this, "state")} >State</th>
              {actionHeader}
            </tr>
          </thead>
          <tbody>
            {units}
          </tbody>
        </Table>
      </Container>
      </React.StrictMode>
    );
  }
}