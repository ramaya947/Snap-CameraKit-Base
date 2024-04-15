import { React, useRef, useEffect, useState } from "react";
import { bootstrapCameraKit, createMediaStreamSource, Transform2D } from "@snap/camera-kit";
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Button, ButtonGroup, ToggleButton } from 'react-bootstrap';
import "./CameraKit.css";

export default function CameraKit(props) {
    const ref = useRef(null);
    var [session, setSession] = useState(null)
    var [selectedLens, setSelectedLens] = useState(null)
    var [isPlaying, setIsPlaying] = useState(false);
    var lenses = useRef(null);
    var stream = useRef(null);
    var [currentLensIndex, setCurrentLensIndex] = useState(0)
    var [started, setStarted] = useState(false);
    var [cameraType, setCameraType] = useState('user');
    var [orientation, setOrientation] = useState('landscape');

    var setNextLens = async (diff) => {
        currentLensIndex = (currentLensIndex >= lenses.current.length - 1) ? 1 : currentLensIndex + diff;
        setCurrentLensIndex(currentLensIndex);

        selectedLens = lenses.current.lenses[currentLensIndex];
        setSelectedLens(selectedLens);
        await session.applyLens(selectedLens);
    };

    var toggleCameraType = async () => {
        console.log('Toggling')
        cameraType = cameraType === 'environment' ? 'user' : 'environment';
        setCameraType(cameraType);

        await session.setSource(createMediaStreamSource(stream.current, { transform: Transform2D.MirrorX, cameraType }));
        console.log("Toggled to ", cameraType);
    }

    var toggleSessionStatus = () => {
        if (session?.playing?.live)
            session.pause();
        else
            session.play()

        setIsPlaying(session.playing.live);
    };

    useEffect(() => {
        async function setup () {
            const apiToken = process.env.REACT_APP_SNAP_API_TOKEN;
            const cameraKit = await bootstrapCameraKit({ apiToken, logger: 'console' });
    
            // Using an existing canvas
            const canvas = document.getElementById(ref.current.id);
            session = (await cameraKit.createSession({ liveRenderTarget: canvas }));
            setSession(session);
            session.events.addEventListener('error', (event) => {
                console.error(event.detail.error);
                
                if (event.detail.error.name === 'LensExecutionError') {
                    // The currently-applied Lens encountered a problem that is most likely unrecoverable and the Lens has been removed.
                    // Your application may want to prevent this Lens from being applied again.
                }
            });    
            
            stream.current = await navigator.mediaDevices.getUserMedia({ video: true });
            const source = createMediaStreamSource(stream.current, { transform: Transform2D.MirrorX, cameraType });
            await session.setSource(source);

            // Loading one or more Lens Groups – Lenses from all groups are returned as a single array of lenses.
            lenses.current = await cameraKit.lensRepository.loadLensGroups([
                process.env.REACT_APP_LENS_GROUP_ID
            ]);

            selectedLens = lenses.current.lenses[currentLensIndex];
            setSelectedLens(selectedLens);
            
            await session.applyLens(selectedLens);

            session.play();
            setIsPlaying(session.playing.live);
        }

        if (started && !session)
            setup();
    });

    return (
        <div className="Col" style={{ height: '100%' }}>
            <div className="Row" style={{ flex: 3, display: 'flex' }}>
                <div className="Col" style={{ flex: 1 }}>
                    {
                        (currentLensIndex !== 0) ? 
                        <div className="Button-Container">
                            <Button variant="secondary" onClick={async () => { await setNextLens(-1); }}>Previous Lens</Button>
                        </div> : <></>
                    }
                </div>
                <div id="snap-canvas-container" style={ (orientation === 'portrait') ? { width: "270px", height: "480px" } : { height: "270px", width: "480px" }}>
                    <canvas id="snap-canvas" ref={ref} style={ (orientation === 'portrait') ? { width: "270px", height: "480px" } : { height: "270px", width: "480px" }}/>
                    <div id="snap-canvas-lens-detail">
                        <p>{started && isPlaying ?  `${selectedLens?.name} (${currentLensIndex + 1}/${lenses?.current?.lenses?.length})` : ''}</p>
                    </div>
                    {
                        (!started) ? 
                        <div className="Button-Container Start-Button">
                            <Button variant="primary" onClick={ () => { setStarted(true) } }>Start</Button>
                        </div> : <></>
                    }    
                </div>
                <div className="Col" style={{ flex: 1 }}>
                    {
                        (currentLensIndex < lenses.current?.lenses.length - 1) ? 
                        <div className="Button-Container">
                            <Button variant="secondary" onClick={async () => { await setNextLens(1); }}>Next Lens</Button>
                        </div> : <></>
                    }
                </div>
            </div>
            <div className="Column Controls" style={{ display : 'flex', flex: 1, }}>
                {
                    (started) ?
                    <Accordion style={{ width: '100%'}}>
                        <AccordionItem eventKey="0">
                            <AccordionHeader>Options</AccordionHeader>
                            <AccordionBody>
                                <div className="Row Spacer">
                                    <div className="Button-Container">
                                        <Button variant="primary" onClick={ async () => { await toggleCameraType()} }>Switch to {(cameraType === 'user') ? 'rear' : 'front' } camera</Button>
                                    </div>
                                    <div className="Button-Container">
                                        <Button variant="primary" onClick={ toggleSessionStatus }>{(isPlaying) ? 'Pause' : 'Play'}</Button>
                                    </div>
                                </div>
                                <div className="Row">
                                <ButtonGroup className="mb-2">
                                    <ToggleButton
                                    id="portrait-toggle-check"
                                    type="checkbox"
                                    variant="secondary"
                                    checked={(orientation === "portrait")}
                                    value="portrait"
                                    onChange={(e) => {setOrientation("portrait")}}
                                    >
                                    Portait
                                    </ToggleButton>
                                    <ToggleButton
                                    id="landscape-toggle-check"
                                    type="checkbox"
                                    variant="secondary"
                                    checked={(orientation === 'landscape')}
                                    value="landscape"
                                    onChange={(e) => {setOrientation("landscape")}}
                                    >
                                    Landscape
                                    </ToggleButton>
                                </ButtonGroup>
                                </div>
                            </AccordionBody>
                        </AccordionItem>
                    </Accordion> : <></>
                }
            </div>
        </div>
    );
}
