import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function Graph({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    console.log('Data received for graph:', data);

    // Define the width and height for the SVG
    const width = 900; // Adjusted for larger canvas
    const height = 700; // Adjusted for larger canvas

    // Create the SVG canvas and ensure it takes up the full width of the parent container
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);  // This defines the viewBox for responsive scaling

    // Clear previous graph before rendering a new one
    svg.selectAll('*').remove();

    // Proceed only if nodes and links are provided
    if (data.nodes && data.links && data.nodes.length && data.links.length) {
      console.log('Rendering graph with nodes and links');

      // Ensure that all links reference valid nodes
      const validNodes = new Set(data.nodes.map(node => node.id));
      const validLinks = data.links.filter(link => validNodes.has(link.source) && validNodes.has(link.target));

      // Create a force simulation with increased forces to spread out more
      const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(validLinks)
          .id(d => d.id)
          .distance(300) // Increase link distance to spread nodes farther apart
        )
        .force('charge', d3.forceManyBody().strength(-800)) // Stronger repulsion between nodes
        .force('center', d3.forceCenter(width / 2, height / 2)) // Ensure centering is accurate
        .on('tick', ticked);

      // Draw links (edges)
      const link = svg.append('g')
        .selectAll('line')
        .data(validLinks)
        .enter().append('line')
        .attr('stroke-width', 1)
        .attr('stroke', '#aaa');

      // Draw nodes (web pages)
      const node = svg.append('g')
        .selectAll('circle')
        .data(data.nodes)
        .enter().append('circle')
        .attr('r', 5)
        .attr('fill', 'steelblue')
        .call(d3.drag()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded));

      // Add labels to nodes (URLs or IDs)
      const label = svg.append('g')
        .selectAll('text')
        .data(data.nodes)
        .enter().append('text')
        .attr('dx', 8)
        .attr('dy', '.35em')
        .text(d => d.id);

      // Function to update node and link positions on every tick
      function ticked() {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        label
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      }

      // Drag functions to handle drag events on nodes
      function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

    } else {
      console.log('No nodes or links data available to render the graph.');
    }

  }, [data]);  // Re-run the effect if data changes

  return (
    <svg ref={svgRef}></svg>
  );
}

export default Graph;
