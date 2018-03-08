
class UnitsItem extends React.Component {
  render() {
    return (
      <tr>
        <td> <a href="#" onClick={this.showUnit(this.props.Name)} >{this.props.Name} </a> </td>
        <td> {this.props.ActiveState} </td>
        <td>
          <button onClick={this.stopUnit(this.props.Name)}>Stop</button>
          <button onClick={this.startUnit(this.props.Name)}>Start</button>
          <button onClick={this.restartUnit(this.props.Name)}>Restart</button>
        </td>
      </tr>
    );
  }
  showUnit = (name) => (e) => {
    console.log('show unit:', name);
  }
  stopUnit = (name) => (e) => {
    console.log('stop unit:', name);
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
        <table><tbody>
          <tr><th>Name</th><th>ActiveState</th><th>Action</th></tr>
          {units}
        </tbody></table>
      </div>
    );
  }
}

ReactDOM.render( <UnitsList/>, document.querySelector("#root"));
