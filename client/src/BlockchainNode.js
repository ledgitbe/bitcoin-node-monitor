import { Card, Tag, List, Icon, Spin, Timeline, Row, Col, Divider, Tooltip  } from 'antd';
import { connect } from 'react-redux';
import React from 'react'
import filesize from 'filesize';
import {prefix} from 'prefix-si';
import { inspectNode } from './actions/ui';
import Colorhash from './Colorhash';

class BlockchainNode extends React.Component {
  state = { compact: false };

  componentWillMount() {
    if(window.innerWidth <= 500 || window.innerHeight <= 600) {
      this.setState({ compact: true });
    }
  }

  toggleCompact = () => {
    this.setState({ compact: !this.state.compact });
  }

  render () {
    const { rpc, online, id, inspectNode, isBehind, hasReorged, hasSplit, hasDiverged, isSyncing, blocks, hasMostWork } = this.props;
    const hasRpc = Object.keys(rpc).length > 0;

    let status = 'offline'
    let color = 'red';

    if (online && isSyncing) {
      status = 'syncing'; color = 'orange';
    } else if (online) {
      status = 'online'; color = 'green';
    }

    return <Card
      title={<div>
        <Tooltip title={this.state.compact ? "Expand" : "Compact"}>
          <Icon type={this.state.compact ? "down-circle" : "up-circle"} onClick={this.toggleCompact}/>
        </Tooltip>
        <Divider type="vertical" />
        {this.props.name}
      </div>
      }
      extra={<div>
        <Tooltip title="Click for details">
          <Tag onClick={() => inspectNode(id)} color={color}>{status}</Tag>
        </Tooltip>
        { isBehind && <Tooltip title="headers < maxHeaders(nodes on same chain)"><Tag color="orange">behind</Tag></Tooltip> }
        { hasReorged && <Tag color="red">Experienced reorg at block {hasReorged}</Tag> }
        { hasSplit && <Tag color="red">Has split</Tag> }
        { hasDiverged && <Tag color="red">diverged from longest chain</Tag> }
        { hasMostWork && <Tag color="green">most proof-of-work</Tag> }
      </div>}
      style={{ wordBreak: 'break-all', margin: 8, boxShadow: '0px 7px 30px -16px rgba(0,0,0,0.65)' }}
    >
      <div>
        <Spin indicator={<Icon type="loading" style={{ fontSize: 24, color: '#000' }} spin />} style={{ color: 'black' }} spinning={!hasRpc || !online}>
          { hasRpc && rpc.getblockchaininfo && (
            this.state.compact ? <Row type="flex" justify="space-between">
              <Col>
                <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Best blockhash</strong></div>
              </Col>
              <Col>
                <div><Colorhash explorer hash={rpc.getblockchaininfo.bestblockhash} /></div>
              </Col>
            </Row>
            :
            <Row type="flex" justify="space-between" gutter={16}>
              <Col xs={24} sm={24} md={24} lg={15}>
                <List>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Blocks</strong></div>
                      </Col>
                      <Col>
                        <div>{rpc.getblockchaininfo.blocks}</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Headers</strong></div>
                      </Col>
                      <Col>
                        <div>{rpc.getblockchaininfo.headers}</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Best blockhash</strong></div>
                      </Col>
                      <Col>
                        <div><Colorhash explorer hash={rpc.getblockchaininfo.bestblockhash} /></div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Difficulty</strong></div>
                      </Col>
                      <Col>
                        <div>{rpc.getblockchaininfo.difficulty}</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Median time</strong></div>
                      </Col>
                      <Col>
                        <div>{(new Date(rpc.getblockchaininfo.mediantime * 1000)).toLocaleString()}</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}>
                          <strong>
                            Chainwork
                          </strong>
                          <Divider style={{ backgroundColor: 'rgba(0,0,0,0)' }} type="vertical" />
                          <Tooltip title="log2(accumulated PoW)">
                            <Icon type="question-circle" />
                            </Tooltip>
                          </div>
                      </Col>
                      <Col>
                        <div>{ Math.log2(parseInt('0x' + rpc.getblockchaininfo.chainwork)) }</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Mempool size (bytes)</strong></div>
                      </Col>
                      <Col>
                        <div>{filesize(rpc.getmempoolinfo.bytes)}</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Mempool size (tx)</strong></div>
                      </Col>
                      <Col>
                        <div>{rpc.getmempoolinfo.size}</div>
                      </Col>
                    </Row>
                  </List.Item>
                  <List.Item>
                    <Row type="flex" justify="space-between">
                      <Col>
                        <div style={{ wordBreak: 'break-word', width: 160 }}><strong>Hash power</strong></div>
                      </Col>
                      <Col>
                        <div>{prefix(rpc.getmininginfo.networkhashps, 'h')}</div>
                      </Col>
                    </Row>
                  </List.Item>
                </List>
              </Col>
              <Col xs={0} sm={0} md={0} lg={8}>
                <Timeline pending="..." reverse={true}>
                  { Object.entries(blocks).map(([height, hash]) => <Timeline.Item color='rgba(0,0,0,0.6)' key={`${id}${hash}`}><Colorhash explorer hash={hash} /></Timeline.Item>) }
                </Timeline>
              </Col>
            </Row>

          )}
        </Spin>
      </div>
    </Card>
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...state.data[ownProps.id],
});

export default connect(mapStateToProps, {inspectNode} )(BlockchainNode);
