import React from 'react';
import { Layout } from 'antd';

const { Content, Footer } = Layout;

class MainLayout extends React.Component {
  render() {
    const { content, footer } = this.props;

    return (
      <Layout style={{ background: '#fff', minHeight: '100vh' }}>
        <Content style={{ margin: 0, marginBottom: '64px' }}>
          <div style={{ padding: 0, background: '#fff', minHeight: '100vh' }}>
            { content }
          </div>
        </Content>
        <Footer>
          { footer }
        </Footer>
      </Layout>
    );
  }
}

export default MainLayout;

