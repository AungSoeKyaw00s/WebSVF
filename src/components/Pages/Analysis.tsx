import React, { useEffect, useState } from 'react';
import { Grid, Button, Container, Paper, ClickAwayListener, ButtonGroup, Popper, Grow, MenuList } from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';
import { IAnnotation, IMarker } from 'react-ace';
import { GraphType, webSvfApiFactory } from '../../api/webSvfApi';
import RenderSvg, { IOnGraphClickProps } from '../RenderSvg';
import { useSelector } from 'react-redux';
import { IStore } from '../../store/store';
import Editor from '../Editor';
import styled from 'styled-components';
import { IThemeProps } from '../../themes/theme';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const webSvfApi = webSvfApiFactory();

const graphNames: Record<GraphType, string> = {
  [GraphType.Callgraph]: 'CallGraph',
  [GraphType.Icfg]: 'ICFG',
  [GraphType.Pag]: 'PAG',
  [GraphType.Svfg]: 'SVFG',
  [GraphType.Vfg]: 'VFG'
};

const HomeWrapper = styled.div`
  height: calc(100% - ${({ theme }: IThemeProps) => theme.spacing(8)}px);
  max-height: calc(100% - ${({ theme }: IThemeProps) => theme.spacing(8)}px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const HomeContainer = styled(Container)`
  && {
    height: 100%;
    max-height: 100%;
    overflow: hidden;
    padding-top: ${({ theme }: IThemeProps) => theme.spacing(3)}px;
  }
`;

const HomePaper = styled(Paper)`
  && {
    height: 100%;
  }
`;

const ScrollablePaper = styled(HomePaper)`
  && {
    max-height: 100%;
    overflow: scroll;
  }
`;

const StaticButtonGroup = styled(ButtonGroup)`
  && {
    position: absolute;
    top: 0;
    margin-top: ${({ theme }: IThemeProps) => theme.spacing(3)}px;
    margin-left: ${({ theme }: IThemeProps) => theme.spacing(3)}px;
  }
`;

export const Analysis: React.FC = () => {
  const [editorContent, setEditorContent] = useState('//write your C code here');
  const selectedFile = useSelector((store: IStore) => store.selectedFile);

  const [anlyseDropdownOpen, setAnlyseDropdownOpen] = useState(false);
  const analyseDropdownRef = React.useRef(null);
  const [selectedGraph, setSelectedGraph] = useState<GraphType>(GraphType.Callgraph);
  const [svgs, setSvgs] = useState<any>();

  useEffect(() => {
    if (selectedFile?.content) {
      setEditorContent(selectedFile?.content);
    }
  }, [selectedFile?.content]);

  const [output, setOutput] = useState('');
  const [markers, setMarkers] = useState<IMarker[]>([]);
  const [annotations, setAnnotations] = useState<IAnnotation[]>([]);

  const onGraphClick = ({ markers, annotations }: IOnGraphClickProps) => {
    console.log('markers', markers);
    console.log('annotations', annotations);

    setMarkers(markers);
    setAnnotations(annotations);
  };

  const handleClose = (event: React.MouseEvent<Document>) => {
    if (analyseDropdownRef.current && (analyseDropdownRef.current as any).contains(event.target)) {
      return;
    }

    setAnlyseDropdownOpen(false);
  };

  const onAnalyseClick = async () => {
    setAnlyseDropdownOpen(false);

    const response = await webSvfApi.analyseAll({ fileName: 'example', code: editorContent });
    setSvgs(response);

    setMarkers([]);
    setAnnotations([]);
    setOutput(response[selectedGraph]);
  };

  const onGraphSelection = (graph: GraphType) => {
    setSelectedGraph(graph);
    setOutput(svgs[graph]);
    setAnlyseDropdownOpen(false);
  };

  return (
    <HomeWrapper>
      <HomeContainer maxWidth='xl'>
        <Grid container spacing={3} style={{ height: '100%', maxHeight: '100%' }}>
          <Grid item xs={12} md={6} style={{ height: '100%', maxHeight: '100%' }}>
            <HomePaper>
              <Editor
                mode='c_cpp'
                onChange={(value) => setEditorContent(value)}
                name='main-editor'
                value={editorContent}
                annotations={annotations}
                markers={markers}
              />
            </HomePaper>
          </Grid>
          <Grid item xs={12} md={6} lg={6} style={{ height: '100%', maxHeight: '100%', position: 'relative' }}>
            <StaticButtonGroup variant='contained' color='primary' ref={analyseDropdownRef} aria-label='split button'>
              <Button onClick={() => onAnalyseClick()}>Analyse</Button>
              <Button
                color='primary'
                size='small'
                aria-label='select merge strategy'
                aria-haspopup='menu'
                onClick={() => setAnlyseDropdownOpen((prevOpen) => !prevOpen)}
                disabled={!svgs}>
                {graphNames[selectedGraph]}
                <ArrowDropDownIcon />
              </Button>
            </StaticButtonGroup>
            <Popper open={anlyseDropdownOpen} anchorEl={analyseDropdownRef.current} role={undefined} transition disablePortal>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
                  }}>
                  <Paper>
                    <ClickAwayListener onClickAway={handleClose}>
                      <MenuList id='split-button-menu'>
                        {Object.values(GraphType).map((key) => (
                          <MenuItem key={key} selected={key === selectedGraph} onClick={() => onGraphSelection(key as GraphType)}>
                            {graphNames[key as GraphType]}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
            <ScrollablePaper style={{ paddingTop: 50 }}>{output && <RenderSvg output={output} onGraphClick={onGraphClick} />}</ScrollablePaper>
          </Grid>
        </Grid>
      </HomeContainer>
    </HomeWrapper>
  );
};
