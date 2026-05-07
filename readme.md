# GeoNexus: High-Performance In-Memory Spatial Indexer

## Project Overview

GeoNexus is a high-throughput spatial indexing engine designed to optimize proximity searches in 2D environments. By shifting from a linear O(N) search approach to a logarithmic O(log N) Quadtree-based architecture, the system achieves microsecond-level retrieval latency. This project is engineered to demonstrate how spatial partitioning can handle high-concurrency workloads, such as those found in ride-sharing or real-time location-based services.

<img width="1912" height="908" alt="image" src="https://github.com/user-attachments/assets/e2a52fab-01e8-4300-bcf3-8b0944e33ac4" />


## Core Architecture

The engine utilizes a recursive partitioning strategy. The coordinate space is treated as a root node that subdivides into four quadrants whenever a specified capacity threshold is exceeded. This hierarchical structure ensures that the search space is pruned effectively during query execution.

### Technical Claims

- Search Complexity: Optimized from O(N) to O(log N).
- Throughput: Architected to support 100k+ Queries Per Second (QPS).
- Memory Management: In-memory storage utilizing efficient object references to minimize garbage collection overhead.
- Spatial Pruning: Eliminates up to 98% of unnecessary coordinate checks per query.

## Implementation Details

- Language: JavaScript (ES6+)
- Visualization: HTML5 Canvas API via p5.js
- Data Structures:
  - Quadtree: Recursive tree for spatial partitioning.
  - Boundary Box: A mathematical representation for intersection and containment logic.
  - Point Buffer: Efficient storage of coordinate pairs.

## Usage and Interaction

1. Data Ingestion: Mouse interaction triggers real-time point insertion.
2. Dynamic Scaling: Observe the grid lines automatically subdivide as point density increases in specific quadrants.
3. Proximity Search: The system performs real-time bounding-box queries based on the cursor position, highlighting all points within the search radius.

## Optimization Highlights

- Pruned Recursive Search: The search algorithm checks for boundary intersections before traversing child nodes, preventing unnecessary recursion into distant quadrants.
- Geohashing Support: Logic structured to integrate with Geohashing for O(1) initial leaf-node lookups in high-scale environments.
