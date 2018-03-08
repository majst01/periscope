
class UnitsItem extends React.Component {
  render() {
    return (
      <tr>
        <td> <a href="#" className="badge badge-light" onClick={this.showUnit(this.props.Name)} >{this.props.Name} </a> </td>
        <td> <span className="badge badge-pill badge-primary" > {this.props.ActiveState} </span> </td>
        <td>
        <div className="btn-group" role="group" aria-label="Unit Actions">
          <button type="button" className="btn btn-danger btn-sm" onClick={this.stopUnit(this.props.Name)}>Stop</button>
          <button type="button" className="btn btn-success btn-sm" onClick={this.startUnit(this.props.Name)}>Start</button>
          <button type="button" className="btn btn-warning btn-sm" onClick={this.restartUnit(this.props.Name)}>Restart</button>
        </div>
        </td>
      </tr>
    );
  }
  showUnit = (name) => (e) => {
    console.log('show unit:', name);
  }
  stopUnit = (name) => (e) => {
    console.log('stop unit:', name);
    this.serverRequest =
      axios
        .post("/unit/", name,, {
          action: 'stop',
        })
        .then(function(response) {
          console.log(response)
          this.setState({ units: response.data.Units });
        });
  }
  startUnit = (name) => (e) => {
    console.log('start unit:', name);
  }
  restartUnit = (name) => (e) => {
    console.log('restart unit:', name);
  }

}


class UnitsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { units: [] };
  }

  componentDidMount() {
    this.serverRequest =
      axios
        .get("/units")
        .then((result) => {
          console.log(result)
          this.setState({ units: result.data.Units });
        });
  }

  render() {
    const units = this.state.units.map((unit, i) => {
      return (
        <UnitsItem key={i} Name={unit.Name} ActiveState={unit.ActiveState} />
      );
    });

    return (
      <div>
        <table className="table table-hover table-sm ">
          <thead className="thead-dark">
            <tr>
              <th scope="col">Name</th><th scope="col">ActiveState</th><th scope="col">Action</th>
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

ReactDOM.render( <UnitsList/>, document.querySelector("#root"));
