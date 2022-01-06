/**
 * Shorthand for an if statement tobe used in defining classes like is-disabled
 */
import {PolygonData} from "./types/datatypes";

export function cl(v: boolean, className: string) {
    if (v) return ` ${className} `;
    return '';
}

type clFun = (v: boolean, className: string) => string;

/**Curried version of cl function that allows to prepend for support of BEM style*/
export function ccl(pre: string): clFun {
    return (v, className) => {
        return cl(v, pre + className)
    }
}

/**
 * Removes an element from a read-only array, by creating a copy without the given element.
 * Use for StateManagement
 * @param arr Array to remove element from
 * @param el element to remove
 */
export function copyRemove(arr: any[], el: any): any[] {
    const idx = arr.indexOf(el);
    const nv = [...arr]
    if (idx == -1) return nv
    nv.splice(idx, 1)
    return nv;
}

/**
 * Creates a copy of an array but replaced an element. Useful for modifying read-only arrays.
 * @param arr array to copy
 * @param idx index of element that will be replaced
 * @param replace the element it will be replaced with.
 */
export function copyChange(arr: any[], idx: number, replace: any): any[] {
    const nv = [...arr]
    nv[idx] = replace
    return nv;
}

/**
 * Parses a path that can be either windows or unix separated by / or \
 * @param path The path to a file
 * r
 */
export function parseFilePath(path: string): { filename: string, folder: string, extension: string } {
    
    const splitChar = path.indexOf('/') == -1 ? '\\' : '/';
    
    //we assume that the path contains either / or \ but not a mixture
    var res = path.split(splitChar);
    
    var fileName = res[res.length - 1];
    
    //split file name by extension '.'
    var fns = fileName.split('.');
    var extension = fns[fns.length - 1]
    
    
    res.pop();
    var folder = res.join(splitChar) + splitChar;
    
    return {
        filename: fileName,
        folder: folder,
        extension: extension
    }
    
}

/**
 * A shorthand for simply waiting for a given duration of MS in async functions.
 * @example
 * await wait(100); //will wait 100ms
 * @param durationMS milliseconds to wait.
 */
export async function wait(durationMS: number) {
    return new Promise((resolve) => setTimeout(resolve, durationMS));
}


export function getSplittingIndicator(i1: PolygonData, i2: PolygonData, outer: PolygonData): PolygonData {
    //compute means of the polygons
    var center1 = [0, 0]
    var center2 = [0, 0]
    for (let i = 0; i < i1.x.length; i++) {
        center1[0] += i1.x[i]
        center1[1] += i1.y[i]
    }
    for (let i = 0; i < i2.x.length; i++) {
        center2[0] += i2.x[i]
        center2[1] += i2.y[i]
    }
    
    center1[0] /= i1.x.length;
    center1[1] /= i1.x.length
    center2[0] /= i2.x.length;
    center2[1] /= i2.x.length
    
    //find mid point between the tow centers
    var cx = (center1[0] + center2[0]) / 2
    var cy = (center1[1] + center2[1]) / 2
    
    //find normal and normalize 0-1
    var nx = center2[1] - center1[1];
    var ny = center1[0] - center1[0];
    var d = Math.sqrt(nx * nx + ny * ny);
    nx /= d;
    ny /= d;
    
    //Rougly estimate size of blob, to make the line this size
    var extentX = Math.max(...outer.x) - Math.min(...outer.x)
    var extentY = Math.max(...outer.y) - Math.min(...outer.y)
    
    const xvals = [nx * extentX / 2 + cx, nx * extentX / 2 - cx, nx * extentX / 2 + cx]
    const yvals = [ny * extentY / 2 + cy, ny * extentY / 2 - cy, ny * extentY / 2 + cy]
    
    return {x: xvals, y: yvals};
}

/**Simply check if outer encompasses inner and return boolean, we only check a single point in inner*/
export function doesPolygonContain(outer: PolygonData, inner: PolygonData) {
    
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    var x = inner.x[0], y = inner.y[0];
    
    var inside = false;
    for (var i = 0, j = outer.x.length - 1; i < outer.x.length; j = i++) {
        var xi = outer.x[i], yi = outer.y[i];
        var xj = outer.x[j], yj = outer.y[j];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}
