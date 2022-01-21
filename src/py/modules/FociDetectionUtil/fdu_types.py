from typing import Tuple

from attr import define


@define
class FociInfo:

    pxarea:float
    #normalized, unnormaluzed max intensity
    max:Tuple[float,float]
    #normalized, unnormaluzed average intensity
    mean:Tuple[float,float]
    #normalized, unnormaluzed contour (lowest) intensity
    contour:Tuple[float,float]
    #intensity dropoff between brightest point and conotur
    drop:float

    def getCSVRow(self,cell:int, focus:int, scale:float):
        return [cell, focus,
         float('%.2f' % (self.pxarea * (scale ** 2))),
         float('%.3f' % self.max[1]),
         float('%.3f' % self.mean[1]),
         float('%.3f' % self.contour[1])]
