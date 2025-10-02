import React from 'react';
import { Composition } from 'remotion';
import { MessageConversation } from './MessageConversation';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MessageConversation"
        component={MessageConversation as any}
        durationInFrames={600} // 20 seconds at 30fps
        fps={30}
        width={390}
        height={844}
        defaultProps={{
          contactName: 'Alex',
          theme: 'imessage',
          alwaysShowKeyboard: true,
          messages: [
            { id: 1, text: "oh no.", sent: false, time: "0:00" },
            { id: 2, text: "i thought you meant.", sent: false, time: "0:02" },
            { id: 3, text: "wow this is awkward", sent: false, time: "0:04" },
            { id: 4, text: "i thought you liked me too.", sent: false, time: "0:06" },
            { id: 5, text: "HAHAHA", sent: true, time: "0:08" },
            { id: 6, text: "I'M JUST KIDDING", sent: true, time: "0:10" },
            { id: 7, text: "I LIKE YOU TOO", sent: true, time: "0:12" },
            { id: 8, text: "you do?! 😊", sent: false, time: "0:14" },
          ]
        }}
      />
    </>
  );
};
