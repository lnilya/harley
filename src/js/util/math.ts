import {printf} from "fast-printf";
import {XAxisProps} from "recharts";

export function mean(data: number[]) {
    var k = 0;
    for (let i = 0; i < data.length; i++)
        k += data[i]
    
    return k/data.length
}
export function hist(data: number[], numOfBuckets: number, format?: XAxisProps) {
    var bins = [];
    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE;
    if(format?.domain){
        min = format.domain[0] as number;
        max = format.domain[1] as number;
    }else{
        for (let i = 0; i < data.length; i++) {
            if(data[i] < min) min = data[i]
            if(data[i] > max) max = data[i]
        }
    }
    min -= Number.EPSILON
    const interval = (max-min)/numOfBuckets
    
    const nf:string = (format?.format || '%.2f') as string;
    //Setup Bins
    for (var i = 0; i < numOfBuckets; i++) {
        bins.push({
            minNum: i*interval + min,
            xmean:printf(nf ,(i + 0.5)*interval + min),
            xinterval:printf(nf + ' - ' + nf,i*interval + min,(i+1)*interval + min),
            maxNum: (i+1)*interval + min,
            count: 0
        })
    }

    //Loop through data and add to bin's count
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        for (var j = 0; j < bins.length; j++) {
            var bin = bins[j];
            if (item > bin.minNum && item <= bin.maxNum) {
                bin.count++;
                break;  // An item can only be in one bin.
            }
        }
    }
    return bins
}