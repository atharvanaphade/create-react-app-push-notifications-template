import { useState, useEffect } from "react";
import http from './http';

import {
    isPushNotificationSupported,
    registerServiceWorker,
    askUserPermission,
    createNotificationSubscription,
    getUserSubscription
} from './push-notifications';

const pushNotificationSupported = isPushNotificationSupported();

export default function usePushNotifications () {
    const [userConsent, setUserConsent] = useState(Notification.permission);
    const [userSubscription, setUserSubscription] = useState(null);
    const [pushServerSubscriptionId, setPushServerSubscriptionId] = useState();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (pushNotificationSupported) {
        setLoading(true);
        setError(false);
        registerServiceWorker().then(() => {
          setLoading(false);
        });
      }
    }, []);

    useEffect(() => {
        if(pushNotificationSupported) {
            setLoading(false);
            setError(false);
            const getExixtingSubscription = async () => {
                const existingSubscription = await getUserSubscription();
                setUserSubscription(existingSubscription);
                setLoading(false);
            };
            getExixtingSubscription();
        }
    }, []);

    const onClickAskUserPermission = () => {
        setLoading(true);
        setError(false);
        askUserPermission().then(consent => {
          setUserConsent(consent);
          if (consent !== "granted") {
            setError({
              name: "Consent denied",
              message: "You denied the consent to receive notifications",
              code: 0
            });
          }
          setLoading(false);
        });
    };

    const onClickSusbribeToPushNotification = () => {
        setLoading(true);
        setError(false);
        createNotificationSubscription()
          .then(function(subscrition) {
            setUserSubscription(subscrition);
            setLoading(false);
          })
          .catch(err => {
            console.error("Couldn't create the notification subscription", err, "name:", err.name, "message:", err.message, "code:", err.code);
            setError(err);
            setLoading(false);
          });
    };
    
    const onClickSendSubscriptionToPushServer = () => {
        setLoading(true);
        setError(false);
        http
          .post("/subscription", userSubscription)
          .then(function(response) {
            setPushServerSubscriptionId(response.id);
            setLoading(false);
          })
          .catch(err => {
            setLoading(false);
            setError(err);
          });
    };

    const onClickSendNotification = async () => {
        setLoading(true);
        setError(false);
        await http.get(`/subscription/${pushServerSubscriptionId}`).catch(err => {
          setLoading(false);
          setError(err);
        });
        setLoading(false);
    };
    
    return {
        onClickAskUserPermission,
        onClickSusbribeToPushNotification,
        onClickSendSubscriptionToPushServer,
        pushServerSubscriptionId,
        onClickSendNotification,
        userConsent,
        pushNotificationSupported,
        userSubscription,
        error,
        loading
    };
}