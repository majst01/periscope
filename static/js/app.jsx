import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css';


class UnitsItem extends React.Component {
  render() {
    var buttonGroup = (
      <td>
        <div className="btn-group" role="group" aria-label="Unit Actions">
          <button type="button" className="btn btn-danger btn-sm" onClick={this.doUnit(this.props.Name, "stop")}>Stop</button>
          <button type="button" className="btn btn-success btn-sm" onClick={this.doUnit(this.props.Name, "start")}>Start</button>
          <button type="button" className="btn btn-warning btn-sm" onClick={this.doUnit(this.props.Name, "restart")}>Restart</button>
        </div>
      </td>
    )
    if (this.props.readonly) {
      buttonGroup = null
    }
    var loadStateBadge = "btn btn-primary"
    var activeStateBadge = "btn btn-primary"
    var subStateBadge = "btn btn-primary"
    switch (this.props.LoadState) {
      case "loaded":
        loadStateBadge = "btn btn-success"
        break;
      default:
        loadStateBadge = "btn btn-warning"
        break;
    }
    switch (this.props.ActiveState) {
      case "active":
        activeStateBadge = "btn btn-success"
        break;
      case "inactive":
        activeStateBadge = "btn btn-warning"
        break;
      default:
        activeStateBadge = "btn btn-warning"
        break;
    }
    switch (this.props.SubState) {
      case "dead":
        subStateBadge = "btn btn-danger"
        break;
      case "running":
      case "mounted":
        subStateBadge = "btn btn-success"
        break;
      case "waiting":
        subStateBadge = "btn btn-warning"
        break;
      default:
        subStateBadge = "btn btn-warning"
        break;
    }
    return (
      <tr>
        <td>{this.props.Description}</td>
        <td>
          <a href="#" className="badge badge-light" onClick={this.doUnit(this.props.Name, "describe")}>{this.props.Name}</a>
        </td>
        <td>
          <div className="btn-group btn-group-sm" role="group" aria-label="Unit Status">
            <button type="button" className={loadStateBadge} >{this.props.LoadState}</button>
            <button type="button" className={activeStateBadge} >{this.props.ActiveState}</button>
            <button type="button" className={subStateBadge} >{this.props.SubState}</button>
          </div>
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
      journal: []
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

  render() {
    const units = this.state.units.filter(unit => {
      return this.state.filterString.length < 3 || unit.Name.indexOf(this.state.filterString) >= 0
    }).map((unit, i) => {
      return (
        <UnitsItem key={i} Description={unit.Description}
          Name={unit.Name}
          LoadState={unit.LoadState}
          ActiveState={unit.ActiveState}
          SubState={unit.SubState}
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
                <th scope="col">Description</th>
                <th scope="col">Name</th>
                <th scope="col">State</th>
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
