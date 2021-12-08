import time
from typing import List

from matplotlib import pyplot as plt, cm

startTimes = []


def tic():
    """Measures times passed. call tic() before start and toc() when finished to get a trace of elapsed time."""
    global startTimes
    startTimes += [time.time()]


def tocr(msg: str = 'Ellpased Time: %.2fms'):
    global startTimes
    se = startTimes.pop()
    end = time.time()
    return (1000 * (end - se));


def toc(task: str = None, divideBy: float = 1.):
    global startTimes
    se = startTimes.pop()
    end = time.time()
    if task is None:
        msg = 'Ellpased Time: %.2f ms'
    else:
        msg = 'Ellpased Time for ' + task + ': % .2f ms'

    print(msg % (1000 * (end - se) / divideBy))


def parseRanges(rangeStr: str, inlcudeLast: bool = True, unique: bool = True) -> List[int]:
    """
    Parses range strings in the form of 1,2,4:8,9 to a list 1,2,4,5,6,7,8,9
    Args:
        rangeStr (): a range sting separated by commas and :
        inlcudeLast (): If true ranges 1:3 => 1,2,3 if false 1:3 => 1,2
    Returns:
        A list of integers
    """
    ranges = [r.strip() for r in rangeStr.split(',')]
    ret = []
    add = 0
    if inlcudeLast: add = 1

    for r in ranges:
        v = r.split(':')
        if len(v) == 1:  # single number
            ret += [int(v[0])]
        else:  # range in form of a:b
            ret += list(range(int(v[0]), int(v[1]) + add))

    if unique:
        return list(set(ret))

    return ret


class MplColorHelper:

    def __init__(self, cmap_name, start_val, stop_val, mpl=None):
        self.cmap = plt.get_cmap(cmap_name)
        self.min = float(start_val)
        self.max = float(stop_val)

    def get_rgba(self, val:float):
        return self.cmap(int(255.0 * (val - self.min) / (self.max - self.min)))
    def get_rgb(self, val):
        rgba = self.get_rgba(val)
        return (rgba[0],rgba[1],rgba[2])
