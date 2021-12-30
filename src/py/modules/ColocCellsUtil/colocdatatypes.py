from typing import List, Tuple

import numpy as np
from attr import define
from shapely.geometry import Polygon


@define
class CCCells:

    # Cell x Foci Polygons in Channel 1
    foci1: List[List[Polygon]]

    # Cell x Foci Polygons in Channel 2
    foci2: List[List[Polygon]]

    # Images 0 => Channel 0, 1=> Channel 1, 2 => Mixed
    imgs: List[Tuple[np.ndarray, np.ndarray, np.ndarray]]

    # Pearson correlations inside cells, with first value being r and second value being the confidence p
    pcc: List[Tuple[float, float]]

    # Pearson correlations inside foci area, with first value being r and second value being the confidence p
    fpcc: List[Tuple[float, float]]
