import React from 'react';
import ReactDOM from 'react-dom';
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
class UnitState extends React.Component {
  constructor(props) {
    super(props);
  }
  getStateClass(state) {
    var result = "btn btn-primary"
    switch (state) {
      case "loaded":
      case "active":
        result = "btn btn-success"
        break;
      case "inactive":
        result = "btn btn-warning"
        break;
      case "dead":
        result = "btn btn-danger"
        break;
      case "running":
      case "mounted":
        result = "btn btn-success"
        break;
      case "waiting":
        result = "btn btn-warning"
        break;
      default:
        result = "btn btn-warning"
        break;
    }
    return result
  }
  render() {
    var loadStateBadge = this.getStateClass(this.props.Unit.LoadState)
    var activeStateBadge = this.getStateClass(this.props.Unit.ActiveState)
    var subStateBadge = this.getStateClass(this.props.Unit.SubState)
    return (
      <div className="btn-group btn-group-sm" role="group" aria-label="Unit Status">
        <button type="button" className={loadStateBadge} >{this.props.Unit.LoadState}</button>
        <button type="button" className={activeStateBadge} >{this.props.Unit.ActiveState}</button>
        <button type="button" className={subStateBadge} >{this.props.Unit.SubState}</button>
      </div>
    )
  }
}

class UnitsItem extends React.Component {
  render() {
    var buttonGroup = (
      <td>
        <div className="btn-group" role="group" aria-label="Unit Actions">
          <button type="button" className="btn btn-danger btn-sm" onClick={this.doUnit(this.props.Unit.Name, "stop")}>Stop</button>
          <button type="button" className="btn btn-success btn-sm" onClick={this.doUnit(this.props.Unit.Name, "start")}>Start</button>
          <button type="button" className="btn btn-warning btn-sm" onClick={this.doUnit(this.props.Unit.Name, "restart")}>Restart</button>
        </div>
      </td>
    )
    if (this.props.readonly) {
      buttonGroup = null
    }
    return (
      <tr>
        <td>{this.props.Unit.Description}</td>
        <td>
          <a href="#" className="badge badge-light" onClick={this.doUnit(this.props.Unit.Name, "describe")}>{this.props.Unit.Name}</a>
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
      sortBy: SortOrder.NAME_ASC
    };
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
            self.setState({ journal: response.data })
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

  toggleSortOrder(field) {
    console.log("toggle:", field)
    switch (field) {
      case "name":
        if (this.state.sortBy == SortOrder.NAME_ASC) {
          this.setState({ sortBy: SortOrder.NAME_DESC })
        } else if (this.state.sortBy == SortOrder.NAME_DESC) {
          this.setState({ sortBy: SortOrder.NAME_ASC })
        } else {
          this.setState({ sortBy: SortOrder.NAME_ASC })
        }
        break;
      case "description":
        if (this.state.sortBy == SortOrder.DESCRIPTION_ASC) {
          this.setState({ sortBy: SortOrder.DESCRIPTION_DESC })
        } else if (this.state.sortBy == SortOrder.DESCRIPTION_DESC) {
          this.setState({ sortBy: SortOrder.DESCRIPTION_ASC })
        } else {
          this.setState({ sortBy: SortOrder.DESCRIPTION_ASC })
        }
        break;
      case "state":
        if (this.state.sortBy == SortOrder.STATE_ASC) {
          this.setState({ sortBy: SortOrder.STATE_DESC })
        } else if (this.state.sortBy == SortOrder.STATE_DESC) {
          this.setState({ sortBy: SortOrder.STATE_ASC })
        } else {
          this.setState({ sortBy: SortOrder.STATE_ASC })
        }
        break;
      default:
        break;
    }
  }

  render() {
    const units = this.state.units.filter(unit => {
      return this.state.filterString.length < 3 || unit.Name.indexOf(this.state.filterString) >= 0
    }).sort((a, b) => {
      switch (this.state.sortBy) {
        case SortOrder.NAME_ASC:
          if (a.Name.toLowerCase() < b.Name.toLowerCase()) return -1;
          if (a.Name.toLowerCase() > b.Name.toLowerCase()) return 1;
          break;
        case SortOrder.NAME_DESC:
          if (a.Name.toLowerCase() < b.Name.toLowerCase()) return 1;
          if (a.Name.toLowerCase() > b.Name.toLowerCase()) return -1;
          break;
        case SortOrder.DESCRIPTION_ASC:
          if (a.Description.toLowerCase() < b.Description.toLowerCase()) return -1;
          if (a.Description.toLowerCase() > b.Description.toLowerCase()) return 1;
          break;
        case SortOrder.DESCRIPTION_DESC:
          if (a.Description.toLowerCase() < b.Description.toLowerCase()) return 1;
          if (a.Description.toLowerCase() > b.Description.toLowerCase()) return -1;
          break;
        case SortOrder.STATE_ASC:
          if (a.SubState.toLowerCase() < b.SubState.toLowerCase()) return -1;
          if (a.SubState.toLowerCase() > b.SubState.toLowerCase()) return 1;
          break;
        case SortOrder.STATE_DESC:
          if (a.SubState.toLowerCase() < b.SubState.toLowerCase()) return 1;
          if (a.SubState.toLowerCase() > b.SubState.toLowerCase()) return -1;
          break;

        default:
          break;
      }
      return 0;
    })
      .map((unit, i) => {
        return (
          <UnitsItem key={i}
            Unit={unit}
            onUnitClicked={this.onUnitClicked.bind(this)}
            readonly={this.state.readonly.data} />
        );
      });

    const journalRows = this.state.journal.map((j, i) => {
      return (
        <tr key={i}><td>{j}</td></tr>
      );
    });

    let actionHeader = (
      <th scope="col">Action</th>
    )
    if (this.state.readonly.data) (
      actionHeader = null
    )

    return (
      <div className="container-fluid">
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <a className="navbar-brand" href="#">Systemd Units</a>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <form className="form-inline my-2 my-lg-0">
              <input className="form-control mr-sm-2"
                type="search"
                placeholder="Filter Service"
                id="filter"
                value={this.state.filterString}
                onChange={this.onFilter.bind(this)}></input>
            </form>
          </div>
        </nav>
        <div>
          <table className="table table-hover table-sm ">
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
          </table>
        </div>
        <div className="card fixed-bottom">
          <div className="card-header">Journal</div>
          <div className="card-body">
            <table>
              <tbody>
                {journalRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<UnitsList />, document.querySelector("#units"));
