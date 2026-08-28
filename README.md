# Supplementary material website

Electronic supplementary material for the Master of Commerce thesis *Deep
Representation Learning for Environmental Regionalisation* (Chris
Laubscher-Pretorius, Stellenbosch University).

## Pages

| File | Contents |
|---|---|
| `index.html` | Overview of the research problem, the dataset, the four-stage framework and the headline results. |
| `architectures.html` | Animated diagrams of every architecture evaluated in the architecture search, plus explainers for the three convolutional operators. |
| `geometry.html` | Extended technical background on the manifold hypothesis, decoder-induced distance, the pullback metric and sampled geodesic paths. |
| `feature-distributions.html` | Complete distributions of the 33 climate features under the K&ouml;ppen-Geiger and feature-learning regionalisations. |

## How the architecture diagrams work

`js/arch-data.js` is **generated, not hand-written**. Each entry lists the
encoder blocks with their channel widths, kernel size, stride and dilation
rate. The renderer in `js/arch-engine.js` derives everything else from the
convolution arithmetic:

- strided layer: `L_out = floor((L_in - 1) / 2) + 1`, and the receptive field
  grows by `(k - 1) * jump` before the jump doubles
- dilated layer: the length is unchanged and the receptive field grows by
  `(k - 1) * d * jump`

Because the geometry is computed rather than drawn, the diagrams cannot drift
away from the tables in the thesis. Regenerating the data file after a
specification changes is enough to update every diagram.

## Running locally

No build step and no external dependencies. Any static file server works:

```bash
python -m http.server 8123
```

Then open <http://localhost:8123>.

## Notes

- The traces in the input and output panels of the diagrams are illustrative,
  showing the shape of the task rather than plotted observations. Measured
  reconstruction quality is the fraction of variance unexplained reported on
  the overview page and in the thesis.
- The thesis contains the principal methods, results and conclusions. The
  website adds interactive diagrams and extended technical material referenced
  by the thesis.
