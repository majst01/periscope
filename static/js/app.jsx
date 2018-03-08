
class UnitsItem extends React.Component {
  render() {
    return (
      <tr>
        <td> {this.props.Name} </td>
        <td> {this.props.ActiveState} </td>
      </tr>
    );
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
          <tr><th>Name</th><th>ActiveState</th></tr>
          {units}
        </tbody></table>
      </div>
    );
  }
}

ReactDOM.render( <UnitsList/>, document.querySelector("#root"));
