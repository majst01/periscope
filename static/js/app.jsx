
class UnitsItem extends React.Component {
  render() {
    return (
      <tr>
        <td> {this.props.Description} </td>
        <td> <a href="#" className="badge badge-light" onClick={this.doUnit(this.props.Name, "describe")} >{this.props.Name} </a> </td>
        <td> <span className="badge badge-pill badge-primary" > {this.props.LoadState} </span> </td>
        <td> <span className="badge badge-pill badge-primary" > {this.props.ActiveState} </span> </td>
        <td> <span className="badge badge-pill badge-primary" > {this.props.SubState} </span> </td>
        <td>
        <div className="btn-group" role="group" aria-label="Unit Actions">
          <button type="button" className="btn btn-danger btn-sm" onClick={this.doUnit(this.props.Name, "stop")}>Stop</button>
          <button type="button" className="btn btn-success btn-sm" onClick={this.doUnit(this.props.Name, "start")}>Start</button>
          <button type="button" className="btn btn-warning btn-sm" onClick={this.doUnit(this.props.Name, "restart")}>Restart</button>
        </div>
        </td>
      </tr>
    );
  }
  doUnit = (name, action) => (e) => {
    this.props.onUnitClicked(name, action)
  }

}


class UnitsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { units: [] };
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
  componentDidMount() {
    this.getUnits()
  }

  onUnitClicked(name, action) {
    console.log(action, ' unit:', name);
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
          // this.setState({ FIXME });
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
                           onUnitClicked={this.onUnitClicked.bind(this)} />
      );
    });

    return (
      <div>
        <table className="table table-hover table-sm ">
          <thead className="thead-dark">
            <tr>
              <th scope="col">Description</th>
              <th scope="col">Name</th>
              <th scope="col">LoadState</th>
              <th scope="col">ActiveState</th>
              <th scope="col">SubState</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {units}
          </tbody>
        </table>
      </div>
    );
  }
}

ReactDOM.render( <UnitsList/>, document.querySelector("#units"));
