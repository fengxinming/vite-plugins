import React, { Component } from 'react';
import { Icon, Switch } from '@alicloud/console-components';
import { FilterGroup, Table, Layout } from '@linkdesign/components';
import { getDevices } from '@/services/devices';

const LayoutContainer = Layout.container;

function Status(status) {
  const state = status ? { type: 'select', color: '#1E8E3E' } : { type: 'warning', color: '#FF0000' };

  return (
    <div>
      <Icon type={state.type} style={{ color: state.color, marginRight: 8 }} size="small" />
      {status ? '已绑定' : '未绑定'}
    </div>
  );
}
export default class Device extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyword: '1'
    };
  }

  componentDidMount() {
    console.info('componentDidMount devices');
  }

  render() {
    console.info('render devices');
    return (
      <LayoutContainer
        title="设备管理"
        breadcrumb={[
          {
            name: '本地控制台',
            link: './'
          },
          {
            name: '设备管理'
          }
        ]}
      >
        <FilterGroup
          source={[
            {
              type: 'button',
              name: 'major',
              label: '主要按钮',
              props: {
                onClick: (e) => {
                  console.info('创建项目');
                }
              }
            },
            {
              type: 'button',
              name: 'second',
              label: '次要按钮',
              props: {
                onClick: (e) => {
                  console.info('刷新按钮', e);
                }
              }
            },
            {
              type: 'input',
              name: 'inputContext',
              label: '请输入搜索内容',
              props: {
                hasClear: true,
                onChange: (values) => {
                  console.info('我的输入', values);
                }
              }
            }
          ]}
        />
        <Table
          fetchData={(param) => getDevices(param.PageNo, param.PageSize).then((n) => ({
            dataSource: n.list,
            total: 40
          }))
          }
          extraFilter={{ Name: this.state.keyword }}
          columns={[
            {
              title: '产品名称',
              dataIndex: 'id'
            },
            {
              title: 'ProductKey',
              dataIndex: 'ProductKey'
            },
            {
              title: '节点类型',
              dataIndex: 'NodeType'
            },
            {
              title: '节点状态',
              dataIndex: 'Status',
              cell: (value) => (<Status type={value} />)
            },
            {
              title: '设备起停',
              dataIndex: 'f_value',
              cell: (value, index) => (<Switch style={{ marginTop: 8 }} defaultChecked={!!(index & 2)} />)
            },
            {
              title: '添加时间',
              dataIndex: 'UpdateTime'
            }
          ]}
          actions={{
            title: '操作集合',
            width: 224,
            max: 3,
            maxText: '更多',
            buttons: [
              {
                content: '删除',
                onClick: (e, rawData) => {
                  console.info('删除', e, rawData);
                }
              },
              {
                content: '添加',
                onClick: (e, rawData) => {
                  console.info('添加', e, rawData);
                }
              },
              {
                content: '测试'
              },
              {
                content: '更新',
                onClick: (e, rawData) => {
                  console.info('更新', e, rawData);
                }
              },
              {
                content: '回退'
              }
            ]
          }}
          batchActionContent={[
            {
              size: 'small',
              onClick: (v) => {
                console.info('被选中的', v);
                // eslint-disable-next-line no-alert
                alert('已删除');
              },
              name: '批量删除'
            }
          ]}
          rowSelection={{}}
          locale={{
            prev: '上一页',
            next: '下一页',
            goTo: '到第',
            page: '页',
            go: '确定',
            pageSize: '每页显示',
            total: (value) => {
              return `共有${value}页`;
            }
          }}
        />
      </LayoutContainer>
    );
  }
}
