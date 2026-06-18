"""Phase 3 training pipeline for the no-show scorer.

`extract.py`  — pull appointments from Postgres → leakage-free dataset CSV.
`features.py` — point-in-time feature engineering (pure; the contract lives here).
`train_noshow.py` — train GradientBoosting, evaluate vs the heuristic, save an artifact
                    that `app.scoring.noshow` loads at runtime.
"""
