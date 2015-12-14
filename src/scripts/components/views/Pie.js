import React, { Component } from 'react'
import { PieChart } from 'react-d3'
import { chartDataMappers } from '../../utils'

class Pie extends Component {
  render() {
    const { data, ui } = this.props;
    const measure = _.first(ui.selections.measures);
    const label = ui.selections.dimensions.groups;
    let processedData = [];
    if (measure) {
      processedData = chartDataMappers.pie(data, measure, label);
    }
    return (
      <PieChart
        data={(processedData)}
        width={600}
        height={600}
        radius={200}
        innerRadius={20}
        sectorBorderColor="white"
      />
    )
  }
}

export default Pie
