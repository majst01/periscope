'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import {
  Alert, Button, ButtonGroup,
  Card, CardHeader, CardBody,
  Container, Form, Input,
  Navbar, NavbarBrand, Table
} from 'reactstrap';
import axios from 'axios';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css';

const SortOrder = {
  NAME_ASC: 1,
  NAME_DESC: 2,
  DESCRIPTION_ASC: 3,
  DESCRIPTION_DESC: 4,
  STATE_ASC: 5,
  STATE_DESC: 6
}

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

class UnitState extends React.Component {
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

class UnitsItem extends React.Component {
  render() {
    let buttonGroup = (
      <td>
        <ButtonGroup size="sm" aria-label="Unit Actions">
          <Button color="danger" onClick={this.doUnit(this.props.Unit.Name, "stop")}>Stop</Button>
          <Button color="success" onClick={this.doUnit(this.props.Unit.Name, "start")}>Start</Button>
          <Button color="warning" onClick={this.doUnit(this.props.Unit.Name, "restart")}>Restart</Button>
        </ButtonGroup>
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

class UnitsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      units: [],
      readonly: false,
      filterString: "",
      journal: [],
      sortBy: SortOrder.NAME_ASC,
      journalVisible: false,
      serviceName: ""
    };

    this.onDismiss = this.onDismiss.bind(this);
  }

  componentDidMount() {
    this.getUnits()
    this.getReadonly()
    window.setInterval(() => { this.getUnits() }, 5000)
  }

  getUnits() {
    this.serverRequest =
      axios
        .get("/units")
        .then((result) => {
          console.log(result)
          this.setState({ units: result.data.Units });
        });
  }

  getReadonly() {
    this.serverRequest =
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
      this.serverRequest =
        axios
          .get("/journal", {
            params: {
              name: name
            }
          })
          .then(function (response) {
            console.log("journal:", response)
            self.setState({
              journal: response.data,
              journalVisible: true,
              serviceName: name
            })
          });
    }
    let self = this
    this.serverRequest =
      axios
        .get("/unit", {
          params: {
            name: name,
            action: action
          }
        })
        .then(function (response) {
          console.log(response)
          self.getUnits()
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

  onDismiss() {
    this.setState({ journalVisible: false });
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

    const journalRows = this.state.journal.map((j, i) => {
      if (this.state.journal.length <= 1) {
        return (
          <p key="0">No journal entries</p>
        )
      }
      return (
        <p key={i}>{j}</p>
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
          <Alert color="success" className="fixed-bottom" style={{ height: "20%" }} isOpen={this.state.journalVisible} toggle={this.onDismiss}>
            <h4 className="alert-heading">Journal of {this.state.serviceName}</h4>
            <div style={{ height: "80%", overflowY: "auto" }}>
              {journalRows}
            </div>
          </Alert>
        </Container>
      </React.StrictMode>
    );
  }
}

ReactDOM.render(<UnitsList />, document.querySelector("#units"));
