// Generated from the verified thesis architecture specifications.
// Sequence lengths and receptive fields are recomputed from the
// convolution arithmetic and checked against the published values.
// Do not edit by hand.
window.INPUT_LEN = 6935;
window.INPUT_CH = 6;
window.ARCHITECTURES = [
 {
  "id": "stage1-single-head",
  "name": "Single-head (shared) encoder, 6 strided layers",
  "stage": "Stage 1",
  "pipeline": "both",
  "tagline": "One convolutional stack processes all six variables jointly as a 6 x 6,935 tensor, halving the time axis at every layer until length 109.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "builtin",
  "reductionText": "built into the encoder (six stride-2 layers), then flatten the 256 x 109 map. Per-layer lengths 6935 -> 3468 -> 1734 -> 867 -> 434 -> 217 -> 109; per-layer receptive field 7 -> 19 -> 43 -> 91 -> 187 -> 379 days",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "exact mirror: MLP 5 -> 128 -> 27,904, reshape to 256 x 109, then 6 transposed convolutions (k=7, stride 2, padding 3) with widths reversed 256,256,128,64,32,6 restoring 6 x 6,935. Variational version identical, with the single 128 -> 5 projection replaced by parallel mean and log-variance heads of width 5 each",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 9614411,
  "paramsVae": 9615056,
  "metrics": {
   "mean_fvu_det": 0.0676,
   "mean_fvu_vae": 0.07,
   "silhouette_det": 0.289,
   "spatial_r_det": 0.734,
   "erank_det": 0.803,
   "kappa_det": 5.5
  },
  "outcome": "retained",
  "why": "Deterministic: lost on reconstruction (0.0676 vs 0.0351) but won every latent/cluster metric and cleared the 0.7 effective-rank threshold, at one sixth the parameters. Deterministic block-level parameters: encoder conv 1,220,896; encoder bridge 3,572,485; decoder bridge 3,600,384; decoder conv 1,220,646. Per-channel validation FVU (det): tmax 0.0114, tmin 0.0156, rhmax 0.0152, rhmin 0.0274, wind 0.1019, precip 0.2339. Latent detail (det): train erank 4.001/ratio 0.800/kappa 5.70, validation erank 4.014/ratio 0.803/kappa 5.45, m=4 for 90% variance; PC1+PC2 = 72.2% of validation latent variance; Pillai 4.977, partial eta2 0.7111. Variational metrics: FVU 0.0700, KL 21.85 per sample, silhouette 0.289, spatial r 0.659, partial eta2 0.690, erank ratio 0.943, kappa 2.68, pass. This same network is the Stage 2 strided baseline and the final variational reference model.",
  "refs": [
   "ORIG:26-46 (per-layer table: length, channels, receptive field)",
   "ORIG:48-65 (component table: 6x6935 -> 256x109 -> flatten MLP 27,904 -> 128 -> 5)",
   "ORIG:97 (metrics row)",
   "ORIG:123 (variational metrics row)",
   "APP:41-46 (parameter counts per block)",
   "APP:93-100 (per-channel FVU)",
   "APP:149-152 (erank, kappa, m)",
   "APP:197-200 (silhouette, spatial r, Pillai, partial eta2)",
   "SHORT:33 (k=7, stride 2, padding 3; 6,935 -> 109; RF 379; bridge 27,904)",
   "SHORT:44,46 (parameter and metric rows)",
   "METH:311-331 (bridge-retention rule: MLP kept in both topologies for consistency)"
  ]
 },
 {
  "id": "stage1-multi-head",
  "name": "Multi-head (per-variable) encoder, 6 x 6 strided layers",
  "stage": "Stage 1",
  "pipeline": "both",
  "tagline": "Six independent convolutional stacks, one per input variable, each taking a 1 x 6,935 tensor and each producing 256 x 109, concatenated into a 167,424-dimensional bridge input.",
  "heads": 6,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "per-channel-head"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "per-channel-head"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "per-channel-head"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "per-channel-head"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "per-channel-head"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "per-channel-head"
   }
  ],
  "layersB": [],
  "reduction": "concat",
  "reductionText": "strided downsampling inside each of the six heads (6935 -> 3468 -> 1734 -> 867 -> 434 -> 217 -> 109), then flatten each 256 x 109 head output and concatenate the six vectors; 6 x 27,904 = 167,424",
  "bridgeIn": 167424,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror: MLP 5 -> 128 -> 167,424, split into six 256 x 109 blocks, one transposed-convolution decoder head per variable, each producing 1 x 6,935",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 57665291,
  "paramsVae": 57665936,
  "metrics": {
   "mean_fvu_det": 0.0351,
   "mean_fvu_vae": 0.0553,
   "silhouette_det": 0.276,
   "spatial_r_det": 0.643,
   "erank_det": 0.614,
   "kappa_det": 79.1
  },
  "outcome": "eliminated",
  "why": "Reconstructed best of the two (0.0351 vs 0.0676) but failed the effective-rank collapse check on both splits (train ratio 0.631, validation 0.614, below the 0.7 threshold) with kappa 66.74 train / 79.12 validation, and lost every cluster diagnostic, at roughly six times the parameters. Deterministic block-level parameters: encoder conv 7,318,656 (6 x 1,219,776; per-head first layer is 1->32 not 6->32); encoder bridge 21,431,045; decoder bridge 21,598,464; decoder conv 7,317,126. Per-channel FVU (det): tmax 0.0034, tmin 0.0035, rhmax 0.0050, rhmin 0.0117, wind 0.0706, precip 0.1166. Fifth eigenvalue 1.42 vs first 112.26 (1.3%); m=3 for 90% variance; PC1+PC2 = 81.4%. Pillai 4.509, partial eta2 0.6442. Variational: FVU 0.0553, KL 27.85, silhouette 0.271, spatial r 0.643, partial eta2 0.705, erank ratio 0.937, kappa 2.90, pass; still eliminated because the reconstruction gain did not justify the six-fold parameter increase.",
  "refs": [
   "ORIG:67-84 (topology table: 1 x 6,935 per stack, 256 x 109 per stack, bridge 27,904 vs 167,424)",
   "ORIG:98,124 (metric rows)",
   "APP:41-53 (parameter counts and the six-fold explanation via the bridge-retention rule)",
   "APP:93-100,151-159 (per-channel FVU, erank, eigenvalues)",
   "SHORT:33,45,47",
   "METH:321-326 (concatenation rule, h in R^{6d})"
  ]
 },
 {
  "id": "strided-baseline",
  "name": "Stage 2 configuration 1: strided baseline",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "The Stage 1 single-head winner reused unchanged as the Stage 2 reference: six stride-2 convolutions that compress the sequence inside the encoder.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "builtin",
  "reductionText": "built into encoder; flatten 256 x 109",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "MLP then 6 transposed strided convolutions",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 9614411,
  "paramsVae": 9615056,
  "metrics": {
   "mean_fvu_det": 0.0676,
   "mean_fvu_vae": 0.07,
   "silhouette_det": 0.289,
   "spatial_r_det": 0.734,
   "erank_det": 0.803,
   "kappa_det": 5.5
  },
  "outcome": "selected",
  "why": "Deterministic: joint runner-up. Reached the last two with the sequential hybrid at identical parameter count and balanced latent (kappa 5.5), then lost on silhouette and effective-rank ratio. Variational: selected as the Stage 2 VAE winner, holding the highest effective-rank ratio (0.943) and lowest kappa (2.68) of all eight, beating Dilated B on latent balance and cost despite Dilated B reconstructing about 15 per cent better. Not retrained for Stage 2; the Stage 1 checkpoint was carried forward. Variational latent metrics: silhouette 0.289, spatial r 0.659, partial eta2 0.690, erank 0.943, kappa 2.68.",
  "refs": [
   "APP:230 (baseline carried forward without retraining)",
   "ORIG:158 (summary row)",
   "ORIG:182 (encoder/bridge/decoder sequence)",
   "ORIG:207,241 (deterministic and variational metric rows)",
   "SHORT:69,92,117"
  ]
 },
 {
  "id": "dilated-a",
  "name": "Stage 2 configuration 2: Dilated A, global average pool head",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "Six dilated convolutions at full 6,935 length, collapsed to a single 256-vector by global average pooling, which discards all temporal phase.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "dilated",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 6935,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 64,
    "k": 7,
    "d": 2,
    "len": 6935,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 4,
    "len": 6935,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 6935,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 16,
    "len": 6935,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 32,
    "len": 6935,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "gap",
  "reductionText": "global average pooling of the 256 x 6,935 map over time to a single 256-vector (parameter-free), then MLP 256 -> 128 -> 5",
  "bridgeIn": 256,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "MLP 5 -> 128 -> 256, broadcast the 256-vector over all 6,935 timesteps, then 6 transposed dilated convolutions. Pooling has no inverse, so the decoder cannot mirror the encoder exactly",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 2508875,
  "paramsVae": 2509520,
  "metrics": {
   "mean_fvu_det": 0.6427,
   "mean_fvu_vae": 0.6463,
   "silhouette_det": 0.253,
   "spatial_r_det": 0.55,
   "erank_det": 0.734,
   "kappa_det": 36.3
  },
  "outcome": "eliminated",
  "why": "Cheapest configuration but reconstruction collapsed: FVU 0.6427 deterministic and 0.6463 variational, roughly ten times every other configuration, because the pooled head discards temporal phase. Acts as the lower-bound baseline for the dilated family. Also worst on spatial coherence and, in the variational run, kappa 202.4, more than ten times the next worst. Variational latent metrics: silhouette 0.274, spatial r 0.538, partial eta2 0.618, erank 0.742. Block parameters: encoder conv 1,220,896; encoder bridge 33,541 (256x128+128, then 128x5+5); decoder bridge 33,792; decoder conv 1,220,646.",
  "refs": [
   "APP:232 (global average pooling, discards temporal phase, lower-bound baseline)",
   "ORIG:159,183 (bridge input 256, sequence)",
   "ORIG:208,242 (metrics)",
   "SHORT:70,93,118"
  ]
 },
 {
  "id": "dilated-b",
  "name": "Stage 2 configuration 3: Dilated B, flatten and direct linear",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "Six dilated convolutions at full length flattened into a 1,775,360-dimensional vector mapped straight to the latent by a single linear layer with no hidden layer.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "dilated",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 6935,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 64,
    "k": 7,
    "d": 2,
    "len": 6935,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 4,
    "len": 6935,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 6935,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 16,
    "len": 6935,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 32,
    "len": 6935,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "no temporal reduction at all; the full 256 x 6,935 map is flattened to 1,775,360 and mapped directly to z by one linear layer (no 128-unit hidden layer)",
  "bridgeIn": 1775360,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "linear 5 -> 1,775,360, reshape to 256 x 6,935, then 6 transposed dilated convolutions",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 21970507,
  "paramsVae": 30847312,
  "metrics": {
   "mean_fvu_det": 0.0679,
   "mean_fvu_vae": 0.0594,
   "silhouette_det": 0.323,
   "spatial_r_det": 0.796,
   "erank_det": 0.664,
   "kappa_det": 17.8
  },
  "outcome": "eliminated",
  "why": "Deterministic: failed the effective-rank check (0.664, kappa 17.8) at 2.3 times the baseline parameters. Variational: best reconstruction of the field (0.0594, about 15 per cent better than the strided VAE) and reached the final two, but the missing hidden layer means the second (log-variance) head doubles the bridge, taking the count from 21,970,507 to 30,847,312, an increase of 8,876,805 and about 3.2 times the strided baseline, with a less balanced latent (erank 0.807 vs 0.943). Encoder bridge is exactly 1,775,360 x 5 + 5 = 8,876,805; decoder bridge 10,652,160. Variational latent metrics: silhouette 0.284, spatial r 0.707, partial eta2 0.697, kappa 6.85.",
  "refs": [
   "APP:232 (largest-bridge variant in the family)",
   "ORIG:160,184 (bridge 1,775,360, linear, no hidden layer)",
   "ORIG:209,243,262 (metrics and the 8,876,805 parameter explanation)",
   "SHORT:71,94,119,131"
  ]
 },
 {
  "id": "dilated-c",
  "name": "Stage 2 configuration 4: Dilated C, six-layer strided tail",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "A full-length dilated trunk followed by a six-layer stride-2 tail at width 256 that compresses 6,935 down to 109 before the standard bridge.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "dilated",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 6935,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 64,
    "k": 7,
    "d": 2,
    "len": 6935,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 4,
    "len": 6935,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 6935,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 16,
    "len": 6935,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 32,
    "len": 6935,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 385,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 397,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 421,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 469,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 565,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 757,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "builtin",
  "reductionText": "six strided tail layers, all 256 -> 256, taking 6935 -> 3468 -> 1734 -> 867 -> 434 -> 217 -> 109, then flatten 256 x 109 and MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored 12-layer stack: MLP, reshape 256 x 109, 6 transposed strided, then 6 transposed dilated",
  "rf": 379,
  "rfComputed": 757,
  "paramsDet": 15122507,
  "paramsVae": 15123152,
  "metrics": {
   "mean_fvu_det": 0.0618,
   "mean_fvu_vae": 0.0832,
   "silhouette_det": 0.318,
   "spatial_r_det": 0.302,
   "erank_det": 0.661,
   "kappa_det": 25.8
  },
  "outcome": "eliminated",
  "why": "Deterministic: best reconstruction of the eight (0.0618) but catastrophic spatial coherence (0.302, the lowest of the field by a wide margin), partial eta2 0.565 and a failed rank check (0.661, kappa 25.8). Variational: lowest silhouette of all eight (0.244) and lowest spatial coherence of the final three (0.603), dropped on cluster diagnostics. Encoder conv 3,974,944 (dilated trunk 1,220,896 plus 6 x 459,008 tail). Variational latent metrics: erank 0.894, kappa 3.35, partial eta2 0.693.",
  "refs": [
   "APP:232 (six-layer strided tail compresses to 109)",
   "ORIG:161,185 (6 strided tail layers, mirrored 12-layer decoder)",
   "ORIG:210,244",
   "SHORT:72,95,120"
  ]
 },
 {
  "id": "dilated-d",
  "name": "Stage 2 configuration 5: Dilated D, adaptive pool to 109",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "Six dilated convolutions at full length, then parameter-free adaptive average pooling from 6,935 to 109 so the Stage 1 bridge can be reused unchanged.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "dilated",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 6935,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 64,
    "k": 7,
    "d": 2,
    "len": 6935,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 4,
    "len": 6935,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 6935,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 16,
    "len": 6935,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 32,
    "len": 6935,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive average pooling of the 256 x 6,935 map to 256 x 109 (parameter-free), then flatten to 27,904 and MLP 128 -> 5. Closest analogue of the Stage 1 single-head bridge",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "MLP 5 -> 128 -> 27,904, reshape 256 x 109, upsample back to 6,935, then 6 transposed dilated convolutions",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 9614411,
  "paramsVae": 9615056,
  "metrics": {
   "mean_fvu_det": 0.0882,
   "mean_fvu_vae": 0.1432,
   "silhouette_det": 0.326,
   "spatial_r_det": 0.7,
   "erank_det": 0.838,
   "kappa_det": 4.9
  },
  "outcome": "eliminated",
  "why": "Parameter count is identical to the strided baseline because pooling is parameter-free. Deterministic: dropped in the first cut as one of the three lowest spatial-coherence configurations (0.700), despite the best kappa of the field (4.9). Variational: FVU 0.1432, 2.05 times the baseline, dropped on reconstruction. Variational latent metrics: silhouette 0.311, spatial r 0.759, partial eta2 0.687, erank 0.855, kappa 4.53.",
  "refs": [
   "APP:232 (adaptive pooling to 109, closest analogue of the Stage 1 bridge)",
   "ORIG:162,186",
   "ORIG:211,245,222",
   "SHORT:73,96,121"
  ]
 },
 {
  "id": "hybrid-sequential",
  "name": "Stage 2 configuration 6: sequential hybrid (3 strided then 3 dilated)",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "Three stride-2 layers compress 6,935 to 867 first, then three dilated layers widen the receptive field at that reduced length without further downsampling.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive average pooling from 867 to 109 (the dilated block preserves the 867 length produced by the strided block), then flatten 256 x 109 = 27,904 and MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored hybrid: MLP 5 -> 128 -> 27,904, reshape 256 x 109, upsample, 3 transposed dilated, then 3 transposed strided back to 6 x 6,935",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": 9614411,
  "paramsVae": 9615056,
  "metrics": {
   "mean_fvu_det": 0.0722,
   "mean_fvu_vae": 0.1121,
   "silhouette_det": 0.325,
   "spatial_r_det": 0.776,
   "erank_det": 0.842,
   "kappa_det": 5.6
  },
  "outcome": "selected",
  "why": "Deterministic Stage 2 winner and the parent of all Stage 3 deterministic work. Matched the strided baseline exactly on parameter count (identical channel progression, only the operator in layers 4 to 6 differs), reconstructed within 0.005 channel-mean FVU, and produced the highest effective-rank ratio (0.842) and near-best silhouette with a balanced latent (kappa 5.6). Variational: FVU 0.1121, 1.60 times the strided VAE, eliminated on reconstruction; variational latent metrics silhouette 0.306, spatial r 0.759, partial eta2 0.710, erank 0.879, kappa 4.42. Design inspired by DeepLabv3+ segmentation models. Dilations {1,2,4} are not printed in any source; they are the unique schedule consistent with the stated 379-day receptive field (43 after 3 strided layers, jump 8, plus 8x6x(1+2+4)=336).",
  "refs": [
   "APP:236 (three strided early, three dilated late, RF 379)",
   "ORIG:163,187 (channels 32,64,128 -> 256,256,256; adaptive pool to 109)",
   "ORIG:212,246,222,262",
   "SHORT:74,97,122",
   "METH:557 (sequential hybrid rationale, DeepLabv3+)"
  ]
 },
 {
  "id": "parallel-concat",
  "name": "Stage 2 configuration 7: parallel hybrid, concatenation fusion",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "Two branches read the same 6 x 6,935 input, a short-range 4-layer strided branch (91-day field) and a long-range 6-layer dilated branch (757-day field), fused by channel concatenation and a 1 x 1 convolution.",
  "heads": 1,
  "parallel": true,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "branch-a"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "branch-a"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "branch-a"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "branch-a"
   }
  ],
  "layersB": [
   {
    "type": "dilated",
    "width": 16,
    "k": 7,
    "d": 2,
    "len": 6935,
    "rf": 13,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 32,
    "k": 7,
    "d": 4,
    "len": 6935,
    "rf": 37,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 64,
    "k": 7,
    "d": 8,
    "len": 6935,
    "rf": 85,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 16,
    "len": 6935,
    "rf": 181,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 32,
    "len": 6935,
    "rf": 373,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 64,
    "len": 6935,
    "rf": 757,
    "branch": "branch-b"
   }
  ],
  "reduction": "concat",
  "reductionText": "each branch is pooled to length 109 (branch A from 434, branch B from 6,935), the two 128 x 109 maps are concatenated to 256 x 109, then a 1 x 1 convolution reduces 256 -> 128, giving 128 x 109 = 13,952 flattened into the MLP 128 -> 5",
  "bridgeIn": 13952,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "MLP, 1 x 1 split convolution 128 -> 256, split into two branches, 4 transposed strided in parallel with 6 transposed dilated, then a 1 x 1 convolution to merge back to 6 channels",
  "rf": 757,
  "rfComputed": 757,
  "paramsDet": 4683403,
  "paramsVae": 4684048,
  "metrics": {
   "mean_fvu_det": 0.1134,
   "mean_fvu_vae": 0.1515,
   "silhouette_det": 0.345,
   "spatial_r_det": 0.871,
   "erank_det": 0.618,
   "kappa_det": 30.6
  },
  "outcome": "eliminated",
  "why": "Best silhouette (0.345) and best spatial coherence (0.871) of the whole deterministic field, but the worst effective-rank ratio (0.618, a clear collapse fail) with kappa 30.6, and reconstruction 1.68 times the baseline. Variational: worst FVU of the retained field at 0.1515; variational latent metrics silhouette 0.327, spatial r 0.854, partial eta2 0.684, erank 0.735, kappa 9.54. The thesis stresses that both branches see the full six-channel input, so this is a temporal-scale split, not a reintroduction of the per-variable multi-head topology rejected in Stage 1. Branch dilations {2,4,8,16,32,64} are inferred: the stated 757-day field requires the dilations to sum to 126, and doubling from 2 is the only natural schedule (1+6x126 = 757).",
  "refs": [
   "APP:238 (branch A four-layer strided 91 days, branch B six-layer dilated 757 days, concat plus 1x1 conv)",
   "ORIG:164,188 (channels 32,64,128,128 parallel 16,32,64,128,128,128; bridge 13,952)",
   "ORIG:213,247,145 (parallel branches act on the full joint input)",
   "SHORT:75,98,123"
  ]
 },
 {
  "id": "parallel-sum",
  "name": "Stage 2 configuration 8: parallel hybrid, latent-sum fusion",
  "stage": "Stage 2",
  "pipeline": "both",
  "tagline": "The same two branches as the concat variant, but each branch has its own MLP bridge to a 5-dimensional latent and the two latent vectors are summed.",
  "heads": 1,
  "parallel": true,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "branch-a"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "branch-a"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "branch-a"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "branch-a"
   }
  ],
  "layersB": [
   {
    "type": "dilated",
    "width": 16,
    "k": 7,
    "d": 2,
    "len": 6935,
    "rf": 13,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 32,
    "k": 7,
    "d": 4,
    "len": 6935,
    "rf": 37,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 64,
    "k": 7,
    "d": 8,
    "len": 6935,
    "rf": 85,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 16,
    "len": 6935,
    "rf": 181,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 32,
    "len": 6935,
    "rf": 373,
    "branch": "branch-b"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 64,
    "len": 6935,
    "rf": 757,
    "branch": "branch-b"
   }
  ],
  "reduction": "builtin",
  "reductionText": "each branch is pooled independently to 128 x 109 = 13,952 and passed through its own MLP 13,952 -> 128 -> 5; the two branch latents are then summed",
  "bridgeIn": 13952,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "one MLP per branch, then 4 transposed strided in parallel with 6 transposed dilated, and a 1 x 1 convolution to merge to 6 channels",
  "rf": 757,
  "rfComputed": 757,
  "paramsDet": 8204688,
  "paramsVae": 8205978,
  "metrics": {
   "mean_fvu_det": 0.1034,
   "mean_fvu_vae": 0.1401,
   "silhouette_det": 0.342,
   "spatial_r_det": 0.866,
   "erank_det": 0.679,
   "kappa_det": 16
  },
  "outcome": "eliminated",
  "why": "Same pattern as the concat variant: strong silhouette (0.342) and spatial coherence (0.866) and the joint-best partial eta2 (0.711), but a failed rank check (0.679, kappa 16.0) and reconstruction 1.53 times the baseline. Variational: FVU 0.1401, eliminated on reconstruction; variational latent metrics silhouette 0.340, spatial r 0.818, partial eta2 0.683, erank 0.765, kappa 12.53. Carries two full bridges, which is why the parameter count is 8.20 M against 4.68 M for the concat variant despite having no fusion convolution.",
  "refs": [
   "APP:238 (fuses by summing two branch-specific latent contributions)",
   "ORIG:165,189 (13,952 per branch, sum of branch latents)",
   "ORIG:147 (separate bridge per branch, each branch reduced independently)",
   "ORIG:214,248",
   "SHORT:76,99,124"
  ]
 },
 {
  "id": "depth-strided-2",
  "name": "Stage 3 Phase A: depth_strided_2",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "Sequential hybrid with the strided block cut to two layers, so the dilated block operates at length 1,734 instead of 867.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 1734,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 1734,
    "rf": 187,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 1,734 -> 109, flatten 27,904, MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored: MLP, reshape 256 x 109, upsample, 3 transposed dilated, 2 transposed strided",
  "rf": 187,
  "rfComputed": 187,
  "paramsDet": 9270091,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.076,
   "silhouette_det": 0.327,
   "spatial_r_det": 0.78,
   "erank_det": 0.72,
   "kappa_det": 13
  },
  "outcome": "eliminated",
  "why": "Dropped in the first cut of Phase A: worst condition number of the sweep (kappa 13.0) with a borderline rank ratio of 0.720. Per-channel FVU: tmax 0.013, tmin 0.017, rhmax 0.017, rhmin 0.031, wind 0.120, precip 0.258. Widths {32,64} then {256,256,256} are not printed in the thesis; they are recovered exactly from the stated 9,270,091 parameters (encoder conv 1,048,736, note the first dilated layer maps 64 -> 256). Receptive field 187 days is derived, not printed: 19 after 2 strided layers, jump 4, plus 4x6x(1+2+4)=168.",
  "refs": [
   "ORIG:292 (metrics row, strided 2 dilated 3)",
   "ORIG:303 (elimination reason)",
   "APP:271 (per-channel FVU)",
   "SHORT:147"
  ]
 },
 {
  "id": "depth-strided-4",
  "name": "Stage 3 Phase A: depth_strided_4",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "Sequential hybrid with a fourth strided layer added (width repeated at 128), so the dilated block operates at length 434.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 434,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 434,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 434 -> 109, flatten 27,904, MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored: MLP, reshape 256 x 109, upsample, 3 transposed dilated, 4 transposed strided",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": 9844043,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0769,
   "silhouette_det": 0.274,
   "spatial_r_det": 0.762,
   "erank_det": 0.767,
   "kappa_det": 8.9
  },
  "outcome": "eliminated",
  "why": "Worsened every metric relative to the Stage 2 baseline while adding parameters, so it was dropped first. Per-channel FVU: 0.015, 0.023, 0.018, 0.034, 0.112, 0.260. Widths {32,64,128,128} then {256,256,256} are recovered exactly from the stated 9,844,043 parameters (encoder conv 1,335,712); the fourth strided layer repeats width 128 rather than stepping to 256. Receptive field 763 days is derived, not printed: 91 after 4 strided layers, jump 16, plus 16x6x7 = 672.",
  "refs": [
   "ORIG:293,303",
   "APP:272",
   "SHORT:148"
  ]
 },
 {
  "id": "depth-dilated-2",
  "name": "Stage 3 Phase A: depth_dilated_2",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "Sequential hybrid with the dilated block cut to two layers, halving the receptive field to well under one annual cycle.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 867 -> 109, flatten 27,904, MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored: MLP, reshape 256 x 109, upsample, 2 transposed dilated, 3 transposed strided",
  "rf": 187,
  "rfComputed": 187,
  "paramsDet": 8696395,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0832,
   "silhouette_det": 0.342,
   "spatial_r_det": 0.831,
   "erank_det": 0.771,
   "kappa_det": 8.1
  },
  "outcome": "eliminated",
  "why": "Best cluster diagnostics of Phase A (silhouette 0.342, spatial r 0.831) but the shortest receptive field at 187 days, well under one annual cycle, and the worst channel-mean FVU at 0.0832. Per-channel FVU: 0.016, 0.022, 0.019, 0.036, 0.127, 0.280. Widths confirmed exactly by the 8,696,395 parameter count (encoder conv 761,888). The 187-day figure is stated in the prose.",
  "refs": [
   "ORIG:294,303 (shortest receptive field at 187 days)",
   "APP:273",
   "SHORT:149"
  ]
 },
 {
  "id": "depth-dilated-4-final",
  "name": "depth_dilated_4, the final selected deterministic model",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "Three strided layers compress 6,935 to 867, then four dilated layers at width 256 with dilations 1, 2, 4, 8 push the receptive field to 763 days, roughly two annual cycles.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 867,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive average pooling from 867 to 109 (the dilated block preserves length), then flatten 256 x 109 = 27,904 into the MLP 27,904 -> 128 -> 5. Strided chain 6935 -> 3468 -> 1734 -> 867; receptive field 7 -> 19 -> 43 after the strided block, then 91 -> 187 -> 379 -> 763 across the four dilated layers",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "exact mirror: MLP 5 -> 128 -> 27,904, reshape to 256 x 109, upsample, 4 transposed dilated layers, 3 transposed strided layers, output 6 x 6,935",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": 10532427,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0685,
   "silhouette_det": 0.279,
   "spatial_r_det": 0.727,
   "erank_det": 0.82,
   "kappa_det": 5.5
  },
  "outcome": "selected",
  "why": "Phase A winner on the strength of a 763-day receptive field covering roughly two annual cycles and a 5.1 per cent better channel-mean FVU than the Stage 2 baseline; confirmed unchanged through Phase B (width), Phase C (training settings) and Phase D (latent size), and through the kernel-size check. The only model carried into the downstream clustering analysis, chosen over the final VAE mainly on spatial coherence (0.727 vs 0.659). Validation partial eta2 0.695. Per-channel validation FVU: tmax 0.0120, tmin 0.0169, rhmax 0.0161, rhmin 0.0277, wind 0.1031, precip 0.2353. Held-out test set: channel-mean FVU 0.0692 (train 0.0672), silhouette 0.281, spatial r 0.737, erank ratio 0.815, kappa 5.34. Widths and the 27,904 bridge reproduce the published 10,532,427 parameters exactly (encoder conv 1,679,904; encoder bridge 3,572,485; decoder bridge 3,600,384; decoder conv 1,679,654).",
  "refs": [
   "ORIG:374-406 (final architecture table: 3 strided {32,64,128}, 4 dilated width 256 dilations {1,2,4,8}, pool to 109, bridge 128 hidden, z=5, RF 763, 10,532,427 params, per-channel FVU)",
   "ORIG:408-482 (final block diagram with tensor shapes)",
   "ORIG:295,303 (Phase A metrics and winner rationale)",
   "ORIG:319 (Phase B reference row)",
   "ORIG:354 (kernel reference row, RF 763)",
   "ORIG:761-781 (selected for downstream analysis)",
   "ORIG:799-824 (held-out test performance)",
   "APP:274 (per-channel FVU)",
   "SHORT:150,152,207",
   "LIVE:113-145 (identical final table in the shortened results chapter)"
  ]
 },
 {
  "id": "width-narrow-det",
  "name": "Stage 3 Phase B: width_narrow (0.5x)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with every layer width halved, which also halves the bridge input to 13,952.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 16,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 128,
    "k": 7,
    "d": 8,
    "len": 867,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 867 -> 109, flatten 128 x 109 = 13,952, MLP 128 -> 5",
  "bridgeIn": 13952,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored, halved widths",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": 4428331,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.1128,
   "silhouette_det": 0.304,
   "spatial_r_det": 0.785,
   "erank_det": 0.757,
   "kappa_det": 7.5
  },
  "outcome": "eliminated",
  "why": "Dropped first in Phase B: at half the width it produced the worst channel-mean FVU of the sweep at 0.1128. Per-channel FVU: 0.024, 0.032, 0.022, 0.051, 0.166, 0.382. The 0.5x widths {16,32,64} plus dilated 128 and the 13,952 bridge reproduce the published 4,428,331 parameters exactly.",
  "refs": [
   "ORIG:320 (0.5x, 4,428,331)",
   "ORIG:329 (elimination reason)",
   "APP:275",
   "SHORT:153"
  ]
 },
 {
  "id": "width-wide-det",
  "name": "Stage 3 Phase B: width_wide (1.5x)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with every layer width multiplied by 1.5, giving a 41,856-dimensional bridge input and the best reconstruction of the whole deterministic search.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 48,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 96,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 192,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 384,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 384,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 384,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 384,
    "k": 7,
    "d": 8,
    "len": 867,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 867 -> 109, flatten 384 x 109 = 41,856, MLP 128 -> 5",
  "bridgeIn": 41856,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored, 1.5x widths",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": 18313835,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0528,
   "silhouette_det": 0.256,
   "spatial_r_det": 0.725,
   "erank_det": 0.799,
   "kappa_det": 6.9
  },
  "outcome": "eliminated",
  "why": "Lowest channel-mean FVU of the deterministic search at 0.0528, 23 per cent below the reference and best on every individual channel, but at 1.74 times the parameters and with the worst silhouette (0.256) and lowest partial eta2 (0.659) of the depth and width sweeps combined. Described as a defensible alternative had reconstruction been the dominant criterion. Per-channel FVU: 0.009, 0.011, 0.012, 0.020, 0.077, 0.187. The 1.5x widths {48,96,192} plus dilated 384 and the 41,856 bridge reproduce the published 18,313,835 parameters exactly.",
  "refs": [
   "ORIG:321,329",
   "APP:276 (per-channel FVU, all bolded as best)",
   "SHORT:154,161"
  ]
 },
 {
  "id": "latent-z3-det",
  "name": "Stage 3 Phase D: z = 3 (deterministic)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with the bridge output narrowed to three latent dimensions.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 867,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool to 109, flatten 27,904, MLP 128 -> 3",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 3,
  "decoder": "mirror with MLP 3 -> 128 -> 27,904",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": null,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0814,
   "silhouette_det": 0.318,
   "spatial_r_det": 0.695,
   "erank_det": 0.873,
   "kappa_det": 3.8
  },
  "outcome": "eliminated",
  "why": "Best silhouette (0.318), best partial eta2 (0.701), best erank ratio (0.873) and best kappa (3.8) of the sweep, but reconstruction degraded to 0.0814 and none of the alternatives improved the joint criteria, so z = 5 was retained. Parameter count not reported for the z variants.",
  "refs": [
   "APP:326 (Phase D table)",
   "ORIG:336",
   "SHORT:189"
  ]
 },
 {
  "id": "latent-z7-det",
  "name": "Stage 3 Phase D: z = 7 (deterministic)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with a seven-dimensional latent.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 867,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool to 109, flatten 27,904, MLP 128 -> 7",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 7,
  "decoder": "mirror with MLP 7 -> 128 -> 27,904",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": null,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0651,
   "silhouette_det": 0.262,
   "spatial_r_det": 0.751,
   "erank_det": 0.784,
   "kappa_det": 7.6
  },
  "outcome": "eliminated",
  "why": "Better reconstruction (0.0651) and best spatial coherence of the sweep (0.751), but a lower silhouette, a lower effective-rank ratio (0.784) and partial eta2 0.694. Did not improve the joint criteria.",
  "refs": [
   "APP:328",
   "ORIG:336",
   "SHORT:191"
  ]
 },
 {
  "id": "latent-z10-det",
  "name": "Stage 3 Phase D: z = 10 (deterministic)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with a ten-dimensional latent, the only Phase D point that failed the collapse check.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 2,
    "len": 867,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 4,
    "len": 867,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 7,
    "d": 8,
    "len": 867,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool to 109, flatten 27,904, MLP 128 -> 10",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 10,
  "decoder": "mirror with MLP 10 -> 128 -> 27,904",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": null,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0623,
   "silhouette_det": 0.27,
   "spatial_r_det": 0.696,
   "erank_det": 0.647,
   "kappa_det": 28.8
  },
  "outcome": "eliminated",
  "why": "Best reconstruction of the sweep (0.0623) but failed the effective-rank collapse check at 0.647 with kappa 28.8, and the lowest partial eta2 at 0.672.",
  "refs": [
   "APP:329 (marked FAIL)",
   "ORIG:336",
   "SHORT:192"
  ]
 },
 {
  "id": "kernel-3-det",
  "name": "Kernel sensitivity: k = 3 (deterministic)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 rebuilt with kernel three, strided padding 1 and dilated padding equal to the dilation, cutting the receptive field to 255 days.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 3,
    "d": 1,
    "len": 3468,
    "rf": 3,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 3,
    "d": 1,
    "len": 1734,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 3,
    "d": 1,
    "len": 867,
    "rf": 15,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 3,
    "d": 1,
    "len": 867,
    "rf": 31,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 3,
    "d": 2,
    "len": 867,
    "rf": 63,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 3,
    "d": 4,
    "len": 867,
    "rf": 127,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 3,
    "d": 8,
    "len": 867,
    "rf": 255,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 867 -> 109, flatten 27,904, MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored with k = 3",
  "rf": 255,
  "rfComputed": 255,
  "paramsDet": 8613963,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0793,
   "silhouette_det": 0.29,
   "spatial_r_det": 0.764,
   "erank_det": 0.727,
   "kappa_det": 11.72
  },
  "outcome": "eliminated",
  "why": "Reconstructed less accurately (0.0793) and held a much higher condition number (11.72) despite the best spatial coherence of the kernel check (0.764). Trained at the locked learning rate 1e-3. Parameter count 8,613,963 reproduces exactly from the k = 3 stack with the same widths and the pooled 27,904 bridge.",
  "refs": [
   "ORIG:353,364 (kernel table and rationale)",
   "ORIG:342 (padding rules, learning rates)",
   "SHORT:206"
  ]
 },
 {
  "id": "kernel-15-det",
  "name": "Kernel sensitivity: k = 15 (deterministic)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with kernel fifteen, strided padding 7 and dilated padding 7d, reaching a 1,779-day receptive field.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 15,
    "d": 1,
    "len": 3468,
    "rf": 15,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 15,
    "d": 1,
    "len": 1734,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 15,
    "d": 1,
    "len": 867,
    "rf": 99,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 15,
    "d": 1,
    "len": 867,
    "rf": 211,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 15,
    "d": 2,
    "len": 867,
    "rf": 435,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 15,
    "d": 4,
    "len": 867,
    "rf": 883,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 15,
    "d": 8,
    "len": 867,
    "rf": 1779,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool 867 -> 109, flatten 27,904, MLP 128 -> 5",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored with k = 15",
  "rf": 1779,
  "rfComputed": 1779,
  "paramsDet": 14369355,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.0665,
   "silhouette_det": 0.254,
   "spatial_r_det": 0.649,
   "erank_det": 0.738,
   "kappa_det": 11.17
  },
  "outcome": "eliminated",
  "why": "Slightly lower channel-mean FVU than the k = 7 reference, but weakened every latent diagnostic (silhouette 0.254, spatial r 0.649, erank 0.738, kappa 11.17) and added 3.8 million parameters. Trained at the locked learning rate 1e-3.",
  "refs": [
   "ORIG:355,364",
   "SHORT:208"
  ]
 },
 {
  "id": "kernel-30-det",
  "name": "Kernel sensitivity: k = 30 (deterministic)",
  "stage": "Stage 3",
  "pipeline": "deterministic",
  "tagline": "depth_dilated_4 with kernel thirty, a 3,684-day receptive field spanning most of the record, trained at a reduced learning rate.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 30,
    "d": 1,
    "len": 3468,
    "rf": 30,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 30,
    "d": 1,
    "len": 1734,
    "rf": 88,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 30,
    "d": 1,
    "len": 867,
    "rf": 204,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 30,
    "d": 1,
    "len": 867,
    "rf": 436,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 30,
    "d": 2,
    "len": 867,
    "rf": 900,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 30,
    "d": 4,
    "len": 867,
    "rf": 1828,
    "branch": "main"
   },
   {
    "type": "dilated",
    "width": 256,
    "k": 30,
    "d": 8,
    "len": 867,
    "rf": 3684,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "adaptive",
  "reductionText": "adaptive pool to 109, flatten 27,904, MLP 128 -> 5. The adaptive pool absorbs the off-by-one sequence lengths caused by the even kernel, so the bridge stays at 27,904 (confirmed by the exact parameter count)",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirrored with k = 30",
  "rf": 3684,
  "rfComputed": 3684,
  "paramsDet": 21563595,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_det": 0.1544,
   "silhouette_det": 0.293,
   "spatial_r_det": 0.741,
   "erank_det": 0.624,
   "kappa_det": 15.54
  },
  "outcome": "eliminated",
  "why": "Failed the effective-rank collapse check at 0.624 with kappa 15.54 and reconstructed worst of the kernel check at 0.1544. Struggled to converge at the locked 1e-3 rate and had to be trained at 3e-4, unlike k = 3 and k = 15. Strided chain with padding 14: 6935 -> 3467 -> 1733 -> 866.",
  "refs": [
   "ORIG:356,364",
   "ORIG:342 (k = 30 trained at 3e-4)",
   "SHORT:209"
  ]
 },
 {
  "id": "vae-final-strided-6",
  "name": "Final variational reference: single-head 6-layer strided VAE",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "The Stage 1 single-head strided network with the 128 -> 5 projection replaced by parallel mean and log-variance heads, retained unchanged through every variational Stage 3 phase.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "builtin",
  "reductionText": "built into the encoder; flatten 256 x 109 = 27,904 into MLP 27,904 -> 128, then two parallel heads of width 5, one for the posterior mean and one for the log-variance (each 128 x 5 + 5 = 645 parameters)",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror: MLP 5 -> 128 -> 27,904, reshape 256 x 109, 6 transposed strided convolutions to 6 x 6,935. One latent draw per input during training; beta = 1, no annealing, no log-variance clamping, no free bits",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": null,
  "paramsVae": 9615056,
  "metrics": {
   "mean_fvu_vae": 0.07,
   "silhouette_det": 0.289,
   "spatial_r_det": 0.659,
   "erank_det": 0.943,
   "kappa_det": 2.68
  },
  "outcome": "reference",
  "why": "Selected at variational Stage 2 and confirmed unchanged by Phase A (depth), Phase B (width), Phase C (training settings), Phase D (latent size) and the kernel check. Kept only as the comparison point for the deterministic model, not carried into the downstream regionalisation, because the posterior standard deviation stayed near zero (mean 0.023 at the final epoch), so the VAE behaved as a deterministic encoder, and it lost on spatial coherence (0.659 vs 0.727). Per-channel validation FVU: tmax 0.0123, tmin 0.0168, rhmax 0.0164, rhmin 0.0287, wind 0.1075, precip 0.2381. KL 21.85 per sample. Partial eta2 0.690. Note: the metric fields carry variational values for this entry.",
  "refs": [
   "ORIG:590-620 (final VAE table: 6 strided layers, widths {32,64,128,256,256,256}, parallel mean and log-variance heads, 128-unit bridge, RF 379, 9,615,056 params, per-channel FVU)",
   "ORIG:622-694 (final VAE block diagram, reshape (256,109))",
   "ORIG:112 (only architectural change is the twin latent heads)",
   "ORIG:510 (Phase A depth-6 reference row)",
   "ORIG:764-781 (posterior sigma 0.023, not carried downstream)",
   "SHORT:232,298",
   "METH:60-107 (VAE loss, beta = 1, one draw per input)"
  ]
 },
 {
  "id": "vae-depth-2",
  "name": "VAE Phase A: depth_2",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Two strided layers only, leaving a 1,734-long feature map and a 110,976-dimensional bridge input, which makes it the heaviest model in the sweep.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 64 x 1,734 = 110,976 directly into the MLP 110,976 -> 128 -> twin 5-dim heads",
  "bridgeIn": 110976,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror: MLP 5 -> 128 -> 110,976, reshape 64 x 1,734, 2 transposed strided layers",
  "rf": 19,
  "rfComputed": 19,
  "paramsDet": null,
  "paramsVae": 28554512,
  "metrics": {
   "mean_fvu_vae": 0.0657,
   "silhouette_det": 0.287,
   "spatial_r_det": 0.621,
   "erank_det": 0.956,
   "kappa_det": 2.13
  },
  "outcome": "eliminated",
  "why": "Best reconstruction (0.0657) and cleanest latent geometry (erank 0.956, kappa 2.13) of the VAE depth sweep, but cost 28.6 million parameters, three times the depth-6 reference, so the reference was retained. Widths {32,64} and the 110,976 bridge reproduce the published 28,554,512 parameters exactly. Receptive field 19 days is derived, not printed.",
  "refs": [
   "ORIG:506,520",
   "SHORT:228"
  ]
 },
 {
  "id": "vae-depth-3",
  "name": "VAE Phase A: depth_3",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Three strided layers, feature map 128 x 867, and a bridge input that happens to equal depth_2 at 110,976.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 128 x 867 = 110,976 into the MLP 110,976 -> 128 -> twin 5-dim heads",
  "bridgeIn": 110976,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror, 3 transposed strided layers",
  "rf": 43,
  "rfComputed": 43,
  "paramsDet": null,
  "paramsVae": 28669392,
  "metrics": {
   "mean_fvu_vae": 0.07,
   "silhouette_det": 0.316,
   "spatial_r_det": 0.669,
   "erank_det": 0.943,
   "kappa_det": 2.46
  },
  "outcome": "eliminated",
  "why": "Best cluster diagnostics of the VAE depth sweep (silhouette 0.316, spatial r 0.669) and reconstruction equal to the reference, but at 28.7 million parameters against 9.62 million. Named in the thesis as a defensible alternative if cluster quality were the dominant criterion. Widths and the 110,976 bridge reproduce the published 28,669,392 parameters exactly.",
  "refs": [
   "ORIG:507,520",
   "SHORT:229"
  ]
 },
 {
  "id": "vae-depth-4",
  "name": "VAE Phase A: depth_4",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Four strided layers, feature map 256 x 434, bridge input 111,104.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 256 x 434 = 111,104 into the MLP 111,104 -> 128 -> twin 5-dim heads",
  "bridgeIn": 111104,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror, 4 transposed strided layers",
  "rf": 91,
  "rfComputed": 91,
  "paramsDet": null,
  "paramsVae": 29161424,
  "metrics": {
   "mean_fvu_vae": 0.0706,
   "silhouette_det": 0.293,
   "spatial_r_det": 0.626,
   "erank_det": 0.945,
   "kappa_det": 2.36
  },
  "outcome": "eliminated",
  "why": "Dropped because depth_3 reconstructed marginally better and led on the cluster diagnostics at a similar parameter count. Widths and the 111,104 bridge reproduce the published 29,161,424 parameters exactly.",
  "refs": [
   "ORIG:508,520",
   "SHORT:230"
  ]
 },
 {
  "id": "vae-depth-5",
  "name": "VAE Phase A: depth_5",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Five strided layers, feature map 256 x 217, bridge input 55,552.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 256 x 217 = 55,552 into the MLP 55,552 -> 128 -> twin 5-dim heads",
  "bridgeIn": 55552,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror, 5 transposed strided layers",
  "rf": 187,
  "rfComputed": 187,
  "paramsDet": null,
  "paramsVae": 15802576,
  "metrics": {
   "mean_fvu_vae": 0.076,
   "silhouette_det": 0.269,
   "spatial_r_det": 0.647,
   "erank_det": 0.94,
   "kappa_det": 2.59
  },
  "outcome": "eliminated",
  "why": "Channel-mean FVU 0.0760, above the 0.0700 reference, so dropped on reconstruction along with depth_7 and depth_8. Widths and the 55,552 bridge reproduce the published 15,802,576 parameters exactly.",
  "refs": [
   "ORIG:509,520",
   "SHORT:231"
  ]
 },
 {
  "id": "vae-depth-7",
  "name": "VAE Phase A: depth_7",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Seven strided layers, feature map 256 x 55, bridge input 14,080.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 55,
    "rf": 763,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 256 x 55 = 14,080 into the MLP 14,080 -> 128 -> twin 5-dim heads",
  "bridgeIn": 14080,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror, 7 transposed strided layers",
  "rf": 763,
  "rfComputed": 763,
  "paramsDet": null,
  "paramsVae": 6980304,
  "metrics": {
   "mean_fvu_vae": 0.0778,
   "silhouette_det": 0.244,
   "spatial_r_det": 0.637,
   "erank_det": 0.944,
   "kappa_det": 2.41
  },
  "outcome": "eliminated",
  "why": "FVU 0.0778 above the reference and one of the two lowest silhouettes of the sweep (0.244). The width pattern extends the baseline by repeating 256; the 14,080 bridge reproduces the published 6,980,304 parameters exactly. Receptive field 763 days is derived, not printed.",
  "refs": [
   "ORIG:511,520",
   "SHORT:233"
  ]
 },
 {
  "id": "vae-depth-8",
  "name": "VAE Phase A: depth_8",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Eight strided layers, feature map 256 x 28, the smallest bridge input in the search at 7,168.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 55,
    "rf": 763,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 28,
    "rf": 1531,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 256 x 28 = 7,168 into the MLP 7,168 -> 128 -> twin 5-dim heads",
  "bridgeIn": 7168,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror, 8 transposed strided layers",
  "rf": 1531,
  "rfComputed": 1531,
  "paramsDet": null,
  "paramsVae": 6121936,
  "metrics": {
   "mean_fvu_vae": 0.0823,
   "silhouette_det": 0.22,
   "spatial_r_det": 0.611,
   "erank_det": 0.946,
   "kappa_det": 2.41
  },
  "outcome": "eliminated",
  "why": "Worst reconstruction (0.0823) and worst silhouette (0.220) of the VAE depth sweep despite the fewest parameters. Sequence chain 6935 -> 3468 -> 1734 -> 867 -> 434 -> 217 -> 109 -> 55 -> 28; the 7,168 bridge reproduces the published 6,121,936 parameters exactly. Receptive field 1,531 days is derived, not printed.",
  "refs": [
   "ORIG:512,520",
   "SHORT:234"
  ]
 },
 {
  "id": "vae-width-narrow",
  "name": "VAE Phase B: width_narrow (0.5x)",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "The six-layer strided VAE with every width halved, bridge input 13,952.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 16,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 128 x 109 = 13,952 into the MLP 13,952 -> 128 -> twin 5-dim heads",
  "bridgeIn": 13952,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror with halved widths",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": null,
  "paramsVae": 4199344,
  "metrics": {
   "mean_fvu_vae": 0.1443,
   "silhouette_det": 0.297,
   "spatial_r_det": 0.722,
   "erank_det": 0.867,
   "kappa_det": 4.24
  },
  "outcome": "eliminated",
  "why": "Dropped first in the VAE width sweep: FVU 0.1443, more than twice the reference, plus the lowest effective-rank ratio (0.867) and highest kappa (4.24) of the three. Widths {16,32,64,128,128,128} and the 13,952 bridge reproduce the published 4,199,344 parameters exactly.",
  "refs": [
   "ORIG:536,546",
   "SHORT:236"
  ]
 },
 {
  "id": "vae-width-wide",
  "name": "VAE Phase B: width_wide (1.5x)",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "The six-layer strided VAE with every width multiplied by 1.5, bridge input 41,856.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 48,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 96,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 192,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 384,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 384,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 384,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 384 x 109 = 41,856 into the MLP 41,856 -> 128 -> twin 5-dim heads",
  "bridgeIn": 41856,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror with 1.5x widths",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": null,
  "paramsVae": 16249328,
  "metrics": {
   "mean_fvu_vae": 0.0599,
   "silhouette_det": 0.24,
   "spatial_r_det": 0.559,
   "erank_det": 0.945,
   "kappa_det": 2.51
  },
  "outcome": "eliminated",
  "why": "Lowest channel-mean FVU of the VAE width sweep at 0.0599, 14 per cent below the reference, but at 1.69 times the parameters and with the silhouette down to 0.240 and spatial coherence down to 0.559. Widths {48,96,192,384,384,384} and the 41,856 bridge reproduce the published 16,249,328 parameters exactly.",
  "refs": [
   "ORIG:538,546",
   "SHORT:238"
  ]
 },
 {
  "id": "vae-latent-z3",
  "name": "VAE Phase D: z = 3",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Six-layer strided VAE with three-dimensional mean and log-variance heads.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 27,904, MLP 128, twin 3-dim heads",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 3,
  "decoder": "mirror with MLP 3 -> 128 -> 27,904",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": null,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_vae": 0.0936,
   "silhouette_det": 0.31,
   "spatial_r_det": 0.709,
   "erank_det": 0.949,
   "kappa_det": 2.28
  },
  "outcome": "eliminated",
  "why": "Best silhouette (0.310), spatial coherence (0.709), erank ratio (0.949) and kappa (2.28) of the variational Phase D, but reconstruction degraded to 0.0936. Partial eta2 0.666.",
  "refs": [
   "APP:379",
   "ORIG:553",
   "SHORT:271"
  ]
 },
 {
  "id": "vae-latent-z7",
  "name": "VAE Phase D: z = 7",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Six-layer strided VAE with seven-dimensional latent heads.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 27,904, MLP 128, twin 7-dim heads",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 7,
  "decoder": "mirror with MLP 7 -> 128 -> 27,904",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": null,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_vae": 0.0661,
   "silhouette_det": 0.238,
   "spatial_r_det": 0.635,
   "erank_det": 0.929,
   "kappa_det": 3.6
  },
  "outcome": "eliminated",
  "why": "Improved reconstruction to 0.0661 but reduced the silhouette to 0.238 and spatial coherence to 0.635, and produced a less balanced latent than the z = 5 reference. Partial eta2 0.692. Every VAE Phase D point cleared the collapse check.",
  "refs": [
   "APP:381",
   "ORIG:553",
   "SHORT:273"
  ]
 },
 {
  "id": "vae-latent-z10",
  "name": "VAE Phase D: z = 10",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Six-layer strided VAE with ten-dimensional latent heads.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 7,
    "d": 1,
    "len": 3468,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 7,
    "d": 1,
    "len": 1734,
    "rf": 19,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 7,
    "d": 1,
    "len": 867,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 434,
    "rf": 91,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 217,
    "rf": 187,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 7,
    "d": 1,
    "len": 109,
    "rf": 379,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 27,904, MLP 128, twin 10-dim heads",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 10,
  "decoder": "mirror with MLP 10 -> 128 -> 27,904",
  "rf": 379,
  "rfComputed": 379,
  "paramsDet": null,
  "paramsVae": null,
  "metrics": {
   "mean_fvu_vae": 0.0653,
   "silhouette_det": 0.197,
   "spatial_r_det": 0.603,
   "erank_det": 0.93,
   "kappa_det": 3.53
  },
  "outcome": "eliminated",
  "why": "Best reconstruction (0.0653) and best partial eta2 (0.708) of the variational Phase D, but the worst silhouette (0.197) and worst spatial coherence (0.603) of the sweep. Unlike the deterministic z = 10 run it still cleared the collapse check at 0.930.",
  "refs": [
   "APP:382",
   "ORIG:553",
   "SHORT:274"
  ]
 },
 {
  "id": "vae-kernel-3",
  "name": "VAE kernel sensitivity: k = 3",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Six-layer strided VAE rebuilt with kernel three and padding one.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 3,
    "d": 1,
    "len": 3468,
    "rf": 3,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 3,
    "d": 1,
    "len": 1734,
    "rf": 7,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 3,
    "d": 1,
    "len": 867,
    "rf": 15,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 3,
    "d": 1,
    "len": 434,
    "rf": 31,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 3,
    "d": 1,
    "len": 217,
    "rf": 63,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 3,
    "d": 1,
    "len": 109,
    "rf": 127,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 256 x 109 = 27,904, MLP 128, twin 5-dim heads",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror with k = 3",
  "rf": 127,
  "rfComputed": 127,
  "paramsDet": null,
  "paramsVae": 8220880,
  "metrics": {
   "mean_fvu_vae": 0.0917,
   "silhouette_det": 0.298,
   "spatial_r_det": 0.722,
   "erank_det": 0.887,
   "kappa_det": 3.72
  },
  "outcome": "eliminated",
  "why": "Matched the reference on silhouette and beat it on spatial coherence (0.722), but at 31 per cent worse reconstruction. Trained at the locked 1e-3 rate. The 8,220,880 count reproduces exactly from a six-layer k = 3 stack with the standard widths and the 27,904 bridge. Receptive field 127 days is derived, not printed.",
  "refs": [
   "ORIG:570,581",
   "SHORT:288"
  ]
 },
 {
  "id": "vae-kernel-15",
  "name": "VAE kernel sensitivity: k = 15",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Six-layer strided VAE with kernel fifteen and padding seven.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 15,
    "d": 1,
    "len": 3468,
    "rf": 15,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 15,
    "d": 1,
    "len": 1734,
    "rf": 43,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 15,
    "d": 1,
    "len": 867,
    "rf": 99,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 15,
    "d": 1,
    "len": 434,
    "rf": 211,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 15,
    "d": 1,
    "len": 217,
    "rf": 435,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 15,
    "d": 1,
    "len": 109,
    "rf": 883,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 27,904, MLP 128, twin 5-dim heads",
  "bridgeIn": 27904,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror with k = 15",
  "rf": 883,
  "rfComputed": 883,
  "paramsDet": null,
  "paramsVae": 12403408,
  "metrics": {
   "mean_fvu_vae": 0.0709,
   "silhouette_det": 0.258,
   "spatial_r_det": 0.64,
   "erank_det": 0.94,
   "kappa_det": 2.4
  },
  "outcome": "eliminated",
  "why": "Matched the reference on reconstruction within noise (0.0709 against 0.0700) but lost on silhouette (0.258) and spatial coherence (0.640) and added 2.8 million parameters. Trained at the locked 1e-3 rate. Receptive field 883 days is derived, not printed.",
  "refs": [
   "ORIG:572,581",
   "SHORT:290"
  ]
 },
 {
  "id": "vae-kernel-30",
  "name": "VAE kernel sensitivity: k = 30",
  "stage": "Stage 3",
  "pipeline": "variational",
  "tagline": "Six-layer strided VAE with kernel thirty and padding fourteen, whose even kernel shortens the encoder output to 108 steps and the bridge input to 27,648.",
  "heads": 1,
  "parallel": false,
  "layers": [
   {
    "type": "strided",
    "width": 32,
    "k": 30,
    "d": 1,
    "len": 3468,
    "rf": 30,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 64,
    "k": 30,
    "d": 1,
    "len": 1734,
    "rf": 88,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 128,
    "k": 30,
    "d": 1,
    "len": 867,
    "rf": 204,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 30,
    "d": 1,
    "len": 434,
    "rf": 436,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 30,
    "d": 1,
    "len": 217,
    "rf": 900,
    "branch": "main"
   },
   {
    "type": "strided",
    "width": 256,
    "k": 30,
    "d": 1,
    "len": 109,
    "rf": 1828,
    "branch": "main"
   }
  ],
  "layersB": [],
  "reduction": "flatten",
  "reductionText": "flatten 256 x 108 = 27,648 (not 27,904) into the MLP 27,648 -> 128 -> twin 5-dim heads. Chain 6935 -> 3467 -> 1733 -> 866 -> 433 -> 216 -> 108. There is no pooling step in the strided VAE, so the shortened sequence propagates into the bridge; the 27,648 value is recovered exactly from the published 17,565,776 parameters",
  "bridgeIn": 27648,
  "bridgeHidden": 128,
  "z": 5,
  "decoder": "mirror with k = 30",
  "rf": 1828,
  "rfComputed": 1828,
  "paramsDet": null,
  "paramsVae": 17565776,
  "metrics": {
   "mean_fvu_vae": 0.0817,
   "silhouette_det": 0.265,
   "spatial_r_det": 0.512,
   "erank_det": 0.783,
   "kappa_det": 386.8
  },
  "outcome": "eliminated",
  "why": "Produced a severely anisotropic latent (kappa 386.8, the worst number anywhere in the search) and spatial coherence collapsed to 0.512, even though the collapse flag still reads pass at erank 0.783. Trained at a reduced learning rate of 3e-4 to converge. Receptive field 1,828 days is derived, not printed.",
  "refs": [
   "ORIG:573,581",
   "ORIG:559 (reduced learning rate for k = 30)",
   "SHORT:291"
  ]
 }
];
