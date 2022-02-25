import styled from "@emotion/styled";

export const SeedPolygon = styled.polygon({
    strokeWidth: 4,
    fill:"none",
    stroke:'#6b972c00',
    cursor:'ew-resize',
})
export const SplitSeedPolygon = styled.polygon({
    fill:'#ff7700',
    pointerEvents:'none'
})
export const SelectedPolygon = styled.polygon({
    cursor:'not-allowed',
    stroke:'#ff00ff',
    fill:'none',
    strokeWidth:1.5,
    '&:hover':{
        fill:'#ff00ff66',
    }
})
export const SplitablePolygon = styled.polygon({
    cursor:'col-resize',
    stroke:'#ff00ff',
    strokeDasharray:4,
    fill:'none',
    strokeWidth:1.5,
    '&:hover':{
        fill:'#ff00ff66',
    }
})
export const SplitPolygon = styled.polygon({
    
    cursor:'not-allowed',
    stroke:'#ff7700',
    fill:'transparent',
    zIndex:2,
    strokeWidth:1.5,
    '&:hover':{
        fill:'#ff770066',
    }
})

export const OutlinePolygonLabeling = styled.polygon({
    stroke:'#d3c000',
    strokeWidth:1,
    fill:'none',
    strokeDasharray:'2 4'
})

