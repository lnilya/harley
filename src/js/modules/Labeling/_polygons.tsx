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
    strokeWidth:0.3,
    '&:hover':{
        fill:'#ff00ff66',
    }
})
export const SplitablePolygon = styled.polygon({
    cursor:'col-resize',
    stroke:'#ff00ff',
    strokeDasharray:1.5,
    fill:'none',
    strokeWidth:0.3,
    '&:hover':{
        fill:'#ff00ff66',
    }
})
export const SplitPolygon = styled.polygon({
    cursor:'not-allowed',
    stroke:'#ff7700',
    fill:'none',
    strokeWidth:0.5,
    '&:hover':{
        fill:'#ff770066',
    }
})

