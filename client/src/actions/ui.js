export const openInspect = () => (
  { type: 'UI_OPEN_INSPECT' }
);

export const closeInspect = () => (
  { type: 'UI_CLOSE_INSPECT' }
);

export const setActiveNode = (id) => (
  { type: 'UI_SET_ACTIVE_NODE',
    payload: id,
  }
);

export const setLoading = (bool) => (
  { type: 'UI_SET_LOADING',
    payload: bool,
  }
);

export const inspectNode = (id) => (dispatch) => {
  dispatch(setActiveNode(id));
  dispatch(openInspect());
};
