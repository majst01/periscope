import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css';

class UnitsItem extends React.Component {
  render() {
    let buttonGroup = (
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
    return (
      <tr>
        <td> {this.props.Description} </td>
        <td> <a href="#" className="badge badge-light" onClick={this.doUnit(this.props.Name, "describe")} >{this.props.Name}</a></td>
        <td> <span className="badge badge-primary" > {this.props.LoadState} </span> </td>
        <td> <span className="badge badge-primary" > {this.props.ActiveState} </span> </td>
        <td> <span className="badge badge-primary" > {this.props.SubState} </span> </td>
        {buttonGroup}
      </tr>
    );
  }
  doUnit(name, action){
    return (e) => {
      this.props.onUnitClicked(name, action)
    }
  }
}

class UnitsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { units: [], readonly: false};
  }

  componentDidMount() {
    this.getUnits()
    this.getReadonly()
    window.setInterval(() => {this.getUnits()}, 5000)
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
    let self = this
    this.serverRequest =
      axios
        .get("/unit", {
          params: {
            name: name,
            action: action
          }
        })
        .then(function(response) {
          console.log(response)
          self.getUnits()
        });
  }

  render() {
    const units = this.state.units.map((unit, i) => {
      return (
        <UnitsItem key={i} Description={unit.Description}
                           Name={unit.Name}
                           LoadState={unit.LoadState}
                           ActiveState={unit.ActiveState}
                           SubState={unit.SubState}
                           onUnitClicked={this.onUnitClicked.bind(this)}
                           readonly={this.state.readonly.data}/>
      );
    });

    let actionHeader = (
      <th scope="col">Action</th>
    )
    if (this.state.readonly.data) (
      actionHeader = null
    )
    return (
      <div className="container-fluid ">
      <h2>Systemd Units</h2>
        <div>
          <table className="table table-hover table-sm ">
            <thead className="thead-dark">
              <tr>
                <th scope="col">Description</th>
                <th scope="col">Name</th>
                <th scope="col">LoadState</th>
                <th scope="col">ActiveState</th>
                <th scope="col">SubState</th>
                { actionHeader }
              </tr>
            </thead>
            <tbody>
              {units}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

ReactDOM.render( <UnitsList/>, document.querySelector("#units"));
