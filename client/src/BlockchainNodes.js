import React from 'react';
import { connect } from 'react-redux';
import BlockchainNode from './BlockchainNode';
import { Drawer, Row, Col } from 'antd';
import ReactJson from 'react-json-view';
import { closeInspect } from './actions/ui';

class BlockchainNodes extends React.Component {
  render() {
    const { nodes, inspecting, activeNode, closeInspect } = this.props;
    return (
      <div>
        { activeNode && (
          <Drawer
            width="60vw"
            title={nodes[activeNode].name}
            visible={inspecting}
            onClose={closeInspect}
          >
            <ReactJson
              displayDataTypes={false}
              src={nodes[activeNode]} 
              collapsed={1}
            />
          </Drawer>
        )
        }

        <Row>
          { Object.keys(nodes).map(id => <Col key={id} xs={24} sm={24} md={12}><BlockchainNode id={id} /></Col>) }
        </Row>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  nodes: state.data,
  inspecting: state.ui.inspecting,
  activeNode: state.ui.activeNode,
});

export default connect(mapStateToProps, { closeInspect })(BlockchainNodes);
