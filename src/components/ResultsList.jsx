import React from 'react';

function ResultsList({ results }) {
  return (
    <ul>
      {results.map((result, index) => (
        <li key={index}>
          <strong>URL:</strong> {result.url} <br />
          <strong>Title:</strong> {result.title} <br />
          <strong>Depth:</strong> {result.depth}
        </li>
      ))}
    </ul>
  );
}

export default ResultsList;
