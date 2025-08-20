"use client";

import React from "react";
import { Metadata } from "next";
import ModernMessagesInterface from "@/components/TableauDeBord/Messages/ModernMessagesInterface";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

const MessagesPage: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Messages" />
      <ModernMessagesInterface />
    </>
  );
};

export default MessagesPage;