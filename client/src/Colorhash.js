import React from 'react';
import { Input, Tooltip, Popover, Icon, message, Divider } from 'antd';

const styles = {
  block: {
    letterSpacing: '-8px',
    display: 'inline-block',
    width: '8px',
    height: '14px',
    overflow: 'hidden',
    padding: 0,
    lineHeight: 1,
  }
}

const Colorhash = ({hash, explorer}) => {
  if (!hash) { return };
  let hashArray = Array.from(hash);

  let addonAfter = (<div>
    <Tooltip title="Copy to clipboard">
      <Icon type="copy" />
    </Tooltip>
  </div>
  );

  if (explorer) {
    addonAfter = (<div>
      <Tooltip title="View in blockexplorer">
        <a href={`https://blockchair.com/bitcoin-cash/block/${hash}`} rel="noopener noreferrer" target="_blank"><Icon type="search" /></a>
      </Tooltip>
      <Divider type="vertical" />
      <Tooltip title="Copy to clipboard">
        <Icon type="copy" onClick={ () => {
          document.getElementById(hash).select();
          document.execCommand('copy');
          message.info("Copied");
        }}/>
    </Tooltip>
  </div>
    );
  }

  let tooltipContent = (
    <div>
      <Input addonAfter={addonAfter} id={hash} value={hash} size={hash.length} />
    </div>
  );

  return (
    <Popover content={tooltipContent} trigger="click">
      <span>
        {hashArray.splice(0,2).join('')}
        { Array(10).fill(0).map((_, index) => {
          let piece = hashArray.splice(0,6).join('');
          return <span key={index} style={{...styles.block, color: `#${piece}`, backgroundColor: `#${piece}` }}>{piece}</span> })
        }
        {hashArray.join('')}
      </span>
    </Popover>
  )
}

export default Colorhash;
