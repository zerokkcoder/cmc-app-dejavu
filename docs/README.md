# Product overview

[中文版](README.zh-CN.md) · [Root README](../README.md)

DÉJÀVU is a one-screen market-state nearest-neighbour engine built for the Data and Visualisation track of Build with CMC: API Hackathon Round 2.

- **Input:** today's six-dimensional market-state fingerprint, computed from CMC first-party indices and global metrics.
- **Process:** expanding-window normalization, standardized Euclidean distance, top-8 neighbours with self/±5-day exclusion, 2D PCA projection.
- **Output:** the most similar historical days and their actual forward paths over the next 7/30/90 days.

See `METHODOLOGY.md` for the math, `API_NOTES.md` for the CMC endpoints and constraints, and `SUBMISSION.md` for the judge checklist.

**Similarity ≠ prediction. Not investment advice.**
