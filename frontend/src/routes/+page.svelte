<script>
    import { onMount } from "svelte";

    let mapController;
    onMount(async () => {
        vw.MapControllerOption = {
            container : "vmap",
            mapMode : "ws3d-map",
			basemapType : vw.ol3.BasemapType.GRAPHIC,
			controlDensity : vw.ol3.DensityType.BASIC,
			interactionDensity : vw.ol3.DensityType.BASIC,
			controlsAutoArrange : true,
			homePosition : vw.ol3.CameraPosition,
			initPosition : vw.ol3.CameraPosition,
		};
		mapController = new vw.MapController(vw.MapControllerOption);
    });
</script>

<div id="vmap" style="width:100%;height:98%;left:0px;top:0px"></div>