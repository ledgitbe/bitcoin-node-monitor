export default function uiReducer(state = { inspecting: false, activeNode: null  }, action) {
  switch (action.type) {
    case 'UI_OPEN_INSPECT':
      return { ...state, inspecting: true};
    case 'UI_CLOSE_INSPECT':
      return { ...state, inspecting: false};
    case 'UI_SET_ACTIVE_NODE':
      return { ...state, activeNode: action.payload };
    default:
      return state;
  }
}
