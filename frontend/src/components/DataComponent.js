import React, { Component } from 'react';

class DataComponent extends Component {
  constructor(props) {
    super(props);
    // Initialize the state with default values
    this.state = {
      phraseStart: null,
      phraseEnd: null,
    };
  }

  // Function to update state based on the results from dtw_comparison
  fetchData = () => {
    const i = this.props.index; // Assuming 'i' comes from props
    const result = dtw_comparison(i);

    this.setState({
      phraseStart: result.phraseStart,
      phraseEnd: result.phraseEnd,
    });
  }

  componentDidMount() {
    this.fetchData();
  }

  render() {
    const { phraseStart, phraseEnd} = this.state;
    return (
      <div>
        <p>Phrase Start: {phraseStart}</p>
        <p>Phrase End: {phraseEnd}</p>
      </div>
    );
  }
}

export default DataComponent;